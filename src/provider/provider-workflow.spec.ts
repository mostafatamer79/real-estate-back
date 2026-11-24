import { ProviderService } from "./provider.service";
import { User, Role } from "../user/user-entity";
import {
  ServiceRequest,
  ServiceStatus,
} from "../service/service-request.entity";

describe("provider application, approval and offer workflow", () => {
  it("persists the application as pending, requires review, and keeps an approved offer under its provider ID", async () => {
    const user = {
      id: "provider",
      role: Role.VIEWER,
      isActive: true,
      nafathVerifiedAt: new Date(),
      providerProfile: null,
    } as unknown as User;
    const request = {
      id: "request",
      category: "marketing",
      serviceType: "تصوير",
      city: "الرياض",
      userId: "customer",
      status: ServiceStatus.PENDING,
      assignedAgentId: null,
      metadata: {},
    };
    const users = {
      findOne: async () => user,
      update: jest.fn(async (_id, patch) => Object.assign(user, patch)),
    };
    const manager = {
      update: jest.fn(async (_entity, _id, patch) =>
        Object.assign(user, patch),
      ),
      findOne: async () => request,
      save: jest.fn(async (_entity, value) => value),
    };
    const db = { transaction: async (fn) => fn(manager) };
    const service = new ProviderService(
      users as never,
      {} as never,
      {} as never,
      db as never,
      { findOne: async () => null } as never,
    );
    const application = await service.apply(user.id, {
      kind: "general",
      city: "الرياض",
      requestedCategories: ["marketing"],
      deliveryModes: ["online"],
    });
    expect(application).toMatchObject({
      status: "pending",
      categories: [],
      requestedCategories: ["marketing"],
    });
    await expect(
      service.offer("request", user.id, {
        amount: 100,
        deliveryMode: "online",
      }),
    ).rejects.toThrow("approval");
    await service.review(
      user.id,
      {
        status: "approved",
        categories: ["marketing"],
        agreementType: "percentage",
        agreementValue: 10,
        minOffer: 50,
        maxOffer: 500,
      },
      "admin",
    );
    expect(user.role).toBe(Role.VIEWER);
    const result = await service.offer("request", user.id, {
      amount: 100,
      deliveryMode: "online",
      note: "عرض",
    });
    expect(result).toMatchObject({
      providerId: user.id,
      amount: 100,
      commission: 10,
    });
    expect(request.metadata).toMatchObject({
      providerOffers: { provider: { amount: 100, deliveryMode: "online" } },
    });
    await expect(
      service.offer("request", user.id, {
        amount: 100,
        deliveryMode: "online",
      }),
    ).rejects.toThrow("already exists");
    expect(manager.save).toHaveBeenCalledWith(
      ServiceRequest,
      expect.objectContaining({ id: "request" }),
    );
  });
});

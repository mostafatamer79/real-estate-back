import { ProviderService } from "./provider.service";
import { Role } from "../user/user-entity";
describe("provider account administration", () => {
  const setup = () => {
    const user = {
      id: "provider",
      role: Role.VIEWER,
      isActive: true,
      providerProfile: { status: "approved", categories: ["marketing"] },
    };
    const manager = {
      update: jest.fn(async (_entity, _id, patch) =>
        Object.assign(user, patch),
      ),
      save: jest.fn(async (_entity, record) => record),
    };
    const service = new ProviderService(
      { findOne: async () => user } as never,
      {} as never,
      {} as never,
      { transaction: async (fn) => fn(manager) } as never,
      {} as never,
    );
    return { service, user, manager };
  };
  it("restricts and restores access without changing approved grants or role", async () => {
    const { service, user, manager } = setup();
    await service.accountAction("provider", "restrict", "admin");
    expect(user.isActive).toBe(false);
    await service.accountAction("provider", "activate", "admin");
    expect(user.isActive).toBe(true);
    expect(user.role).toBe(Role.VIEWER);
    expect(user.providerProfile.categories).toEqual(["marketing"]);
    expect(manager.save).toHaveBeenCalledTimes(2);
  });
  it("archives without deleting financial or request records and does not silently reapprove on restore", async () => {
    const { service, user } = setup();
    await service.accountAction("provider", "archive", "admin");
    expect(user).toMatchObject({
      isActive: false,
      providerProfile: { status: "suspended", archivedAt: expect.any(String) },
    });
    await service.accountAction("provider", "activate", "admin");
    expect(user.providerProfile.status).toBe("suspended");
    expect(user.providerProfile).not.toHaveProperty("archivedAt");
  });
  it("rejects empty notifications", async () => {
    const { service, manager } = setup();
    await expect(service.sendNotice("provider", "  ")).rejects.toThrow();
    expect(manager.save).not.toHaveBeenCalled();
  });
});

describe("historical provider answers", () => {
  it("keeps answers and labels for disabled fields when a pending application is edited", async () => {
    const user = {
      id: "p",
      providerProfile: {
        status: "pending",
        registrationAnswers: { old: "محفوظ" },
        registrationFields: [{ id: "old", label: "حقل سابق" }],
      },
    };
    const service = new ProviderService(
      {
        findOne: async () => user,
        update: async (_id, patch) => Object.assign(user, patch),
      } as never,
      {} as never,
      {} as never,
      {} as never,
      { findOne: async () => null } as never,
    );
    const result = await service.apply("p", {
      kind: "general",
      city: "الرياض",
      requestedCategories: ["marketing"],
      deliveryModes: ["online"],
    });
    expect(result.registrationAnswers.old).toBe("محفوظ");
    expect(result.registrationFields).toContainEqual({
      id: "old",
      label: "حقل سابق",
    });
  });
});

describe("provider registration scope and historical type compatibility", () => {
  const setup = (existing: boolean) => {
    const user = {
      id: "p",
      providerProfile: existing
        ? {
            status: "pending",
            specializationId: "previous",
            specializationTitle: "تخصص سابق",
            requestedCategories: ["legal"],
          }
        : null,
    };
    const settings = {
      findOne: async (key) => ({
        value: JSON.stringify(
          key === "provider_specializations"
            ? [
                {
                  id: "previous",
                  title: "تخصص سابق",
                  enabled: false,
                  categories: ["legal"],
                },
              ]
            : key === "provider_registration_fields"
              ? [
                  {
                    id: "details",
                    label: "تفاصيل الفرع",
                    type: "text",
                    enabled: true,
                    required: true,
                    categories: ["legal_contracts"],
                  },
                ]
              : [],
        ),
      }),
    };
    const service = new ProviderService(
      {
        findOne: async () => user,
        update: async (_id, patch) => Object.assign(user, patch),
      } as never,
      {} as never,
      {} as never,
      {} as never,
      settings as never,
    );
    return service;
  };
  it("requires branch answers when the applicant selects its entire parent category", async () => {
    await expect(
      setup(true).apply("p", {
        kind: "general",
        city: "الرياض",
        requestedCategories: ["legal"],
        deliveryModes: ["online"],
        specializationId: "previous",
      }),
    ).rejects.toThrow("Required provider field");
  });
  it("retains an unchanged disabled type for an existing application only", async () => {
    const input = {
      kind: "general",
      city: "الرياض",
      requestedCategories: ["legal"],
      deliveryModes: ["online"],
      specializationId: "previous",
      registrationAnswers: { details: "تفاصيل" },
    } as const;
    const result = await setup(true).apply("p", input as never);
    expect(result.specializationId).toBe("previous");
    await expect(setup(false).apply("p", input as never)).rejects.toThrow(
      "provider type",
    );
  });
});

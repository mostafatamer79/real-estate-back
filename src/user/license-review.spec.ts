import { Notification } from "../notification/notification.entity";
import { UserService } from "./user.service";
import { Role, VerifyStatus, User } from "./user-entity";

describe("license evidence and review", () => {
  const make = (fields: Partial<User> = {}) => {
    const user = {
      id: "u",
      email: "u@example.test",
      role: Role.BROKER,
      falLicenseNumber: "123",
      licenseDocument: "old.pdf",
      agentVerificationStatus: VerifyStatus.VERIFIED,
      ...fields,
    };
    const service = Object.create(UserService.prototype) as UserService;
    Object.assign(service, { findOne: jest.fn(() => Promise.resolve(user)) });
    const saveReview = jest.fn((_entity: unknown, record: unknown) => Promise.resolve(record));
    Object.assign(service, {
      userRepository: {
        save: jest.fn((x: User) => Promise.resolve(x)),
        manager: {
          transaction: async (
            fn: (manager: {
              save: (entity: unknown, record: unknown) => Promise<unknown>;
            }) => Promise<unknown>,
          ) =>
            fn({
              save: saveReview,
            }),
        },
      },
    });
    return { service, user, saveReview };
  };
  it("retains approval when saving an unchanged license number", async () => {
    const { service, user } = make();
    await service.updateUserDetails("u", {
      falLicenseNumber: "123",
      city: "Riyadh",
    });
    expect(user.agentVerificationStatus).toBe(VerifyStatus.VERIFIED);
  });
  it("requires a new review when license evidence changes", async () => {
    const { service, user } = make();
    await service.updateUserDetails("u", {
      licenseDocument: "replacement.pdf",
    });
    expect(user.agentVerificationStatus).toBe(VerifyStatus.PENDING);
  });
  it("allows an administrator to reject an existing professional license", async () => {
    const { service, user, saveReview } = make();
    await service.reviewLicenseApplication("u", VerifyStatus.REJECTED, "المستند غير واضح");
    expect(user.agentVerificationStatus).toBe(VerifyStatus.REJECTED);
    expect(saveReview).toHaveBeenCalledWith(Notification, expect.objectContaining({ message: "المستند غير واضح" }));
  });
  it("requires a rejection reason without changing the license", async () => {
    const { service, user, saveReview } = make();
    await expect(service.reviewLicenseApplication("u", VerifyStatus.REJECTED, "  ")).rejects.toThrow();
    expect(user.agentVerificationStatus).toBe(VerifyStatus.VERIFIED);
    expect(saveReview).not.toHaveBeenCalled();
  });
  it("does not approve a license with no document", async () => {
    const { service } = make({
      requestedRole: Role.BROKER,
      licenseDocument: undefined,
    });
    await expect(
      service.reviewLicenseApplication("u", VerifyStatus.VERIFIED),
    ).rejects.toThrow();
  });
});

describe("profile maintenance after license rejection", () => {
  it("lets an existing broker save profile data without selecting a new role", async () => {
    const service = Object.create(UserService.prototype) as UserService;
    const user = {
      id: "u",
      email: "u@example.test",
      role: Role.BROKER,
      agentVerificationStatus: VerifyStatus.REJECTED,
    };
    Object.assign(service, { findOne: jest.fn(() => Promise.resolve(user)) });
    Object.assign(service, {
      userRepository: { save: jest.fn((u: User) => Promise.resolve(u)) },
    });
    await expect(
      service.updateUserDetails("u", { role: Role.BROKER, city: "Riyadh" }),
    ).resolves.toMatchObject({ city: "Riyadh" });
  });
});

import { UserService } from "./user.service";
import { Role } from "./user-entity";
describe("manual free trial entitlement", () => {
  const setup = () => {
    const user = {
      id: "user",
      email: "user@example.test",
      role: Role.VIEWER,
      isActive: true,
      hasFreeTrial: false,
      nafathVerifiedAt: null,
    };
    const service = Object.create(UserService.prototype) as UserService;
    Object.assign(service, {
      findOne: async () => user,
      userRepository: { save: async (value) => value },
    });
    return { service, user };
  };
  it.each([true, false])(
    "sets trial=%s without changing account or identity status",
    async (hasFreeTrial) => {
      const { service, user } = setup();
      await service.updateUserDetails(user.id, { hasFreeTrial });
      expect(user.hasFreeTrial).toBe(hasFreeTrial);
      expect(user.nafathVerifiedAt).toBeNull();
      expect(user.isActive).toBe(true);
    },
  );
  it.each(["false", "true", 1, null])(
    "rejects non-boolean entitlement %s instead of granting it through truthiness",
    async (value) => {
      const { service, user } = setup();
      await expect(
        service.updateUserDetails(user.id, { hasFreeTrial: value } as never),
      ).rejects.toThrow("boolean");
      expect(user.hasFreeTrial).toBe(false);
    },
  );
});

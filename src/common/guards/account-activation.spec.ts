import { JwtStrategy } from "./jwt.strategy";
import { Role } from "../../user/user-entity";
describe("account activation with trial access", () => {
  it("rejects a disabled account even when it has a trial and a previously issued token", async () => {
    const strategy = Object.create(JwtStrategy.prototype) as JwtStrategy;
    Object.assign(strategy, {
      userRepository: {
        findOne: async () => ({
          id: "owner",
          role: Role.VIEWER,
          isActive: false,
          hasFreeTrial: true,
        }),
      },
    });
    await expect(
      strategy.validate({ sub: "owner", role: Role.ADMIN }),
    ).rejects.toThrow("no longer active");
  });
  it("uses current role and grants from the account instead of stale token privileges", async () => {
    const strategy = Object.create(JwtStrategy.prototype) as JwtStrategy;
    Object.assign(strategy, {
      userRepository: {
        findOne: async () => ({
          id: "owner",
          role: Role.VIEWER,
          isActive: true,
          hasFreeTrial: true,
          departments: [],
          departmentPermissions: {},
        }),
      },
    });
    expect(
      await strategy.validate({ sub: "owner", role: Role.ADMIN }),
    ).toMatchObject({ role: Role.VIEWER, departmentPermissions: {} });
  });
});

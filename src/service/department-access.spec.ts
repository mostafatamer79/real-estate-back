import { departmentAccess } from "./department-access";
import { Role } from "../user/user-entity";
describe("department request action permissions", () => {
  it("allows read but blocks pricing and status changes for view permission even with membership", () => {
    const user = {
      role: Role.EMPLOYEE,
      departments: ["marketing"],
      departmentPermissions: { marketing: "view" },
    } as never;
    expect(departmentAccess(user, "marketing")).toBe(true);
    expect(departmentAccess(user, "marketing", true)).toBe(false);
    expect(departmentAccess(user, "legal")).toBe(false);
  });
  it("retains assigned specialist and manage access without granting another department", () => {
    expect(
      departmentAccess({ role: Role.MARKETING } as never, "marketing", true),
    ).toBe(true);
    expect(
      departmentAccess({ role: Role.MARKETING } as never, "legal", true),
    ).toBe(false);
  });
});

import { EmployeeManagementGuard } from "./employee-management.guard";
import { ExecutionContext } from "@nestjs/common";
const context = (
  method: string,
  permission: unknown,
  departments: string[] = [],
) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        user: {
          role: "employee",
          departments,
          departmentPermissions: { employees: permission },
        },
      }),
    }),
  }) as ExecutionContext;
describe("employee administration action permissions", () => {
  const guard = new EmployeeManagementGuard();
  it.each(["GET", "HEAD", "OPTIONS"])(
    "allows view permission for %s",
    (method) => expect(guard.canActivate(context(method, "view"))).toBe(true),
  );
  it.each(["POST", "PUT", "PATCH", "DELETE"])(
    "does not let view permission %s users, even with department membership",
    (method) =>
      expect(guard.canActivate(context(method, "view", ["employees"]))).toBe(
        false,
      ),
  );
  it.each(["POST", "PUT", "DELETE"])(
    "allows manage permission for %s",
    (method) => expect(guard.canActivate(context(method, "manage"))).toBe(true),
  );
  it("respects explicit none instead of falling back to department membership", () =>
    expect(guard.canActivate(context("PUT", "none", ["employees"]))).toBe(
      false,
    ));
});

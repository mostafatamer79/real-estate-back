import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Role } from "../../user/user-entity";

@Injectable()
export class EmployeeManagementGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) return false;

    if (user.role === Role.ADMIN) return true;

    const perms = user.departmentPermissions || {};
    const depts = Array.isArray(user.departments) ? user.departments : [];
    const p = perms.employees;
    if (p === false || p === "none") return false;
    if (p === "view") return ["GET", "HEAD", "OPTIONS"].includes(req.method);
    if (p === true || p === "manage") return true;
    if (depts.includes("employees")) return true;

    return false;
  }
}

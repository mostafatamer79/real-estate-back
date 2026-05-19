import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Role } from '../../user/user-entity';

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
    if (depts.includes('employees')) return true;
    if (p === true || p === 'manage' || p === 'view') return true;

    return false;
  }
}

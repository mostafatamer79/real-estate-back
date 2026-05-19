import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { Role } from '../../user/user-entity';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissionKey = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!permissionKey) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new ForbiddenException('Access denied');

    if (user.role === Role.ADMIN) return true;

    const perms = user.departmentPermissions || {};
    const depts = Array.isArray(user.departments) ? user.departments : [];
    if (depts.includes(permissionKey)) return true;
    const v = perms[permissionKey];
    if (v === true || v === 'manage' || v === 'view') return true;

    throw new ForbiddenException('Access denied');
  }
}

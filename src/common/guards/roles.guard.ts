  // roles.guard.ts
  import {
      Injectable,
      CanActivate,
      ExecutionContext,
      ForbiddenException,
    } from '@nestjs/common';
    import { Reflector } from '@nestjs/core';
    import { ROLES_KEY } from '../decorators/roles.decorators';
    import { Role } from '../../user/user-entity';

    @Injectable()
    export class RolesGuard implements CanActivate {
      constructor(private reflector: Reflector) {}

canActivate(context: ExecutionContext): boolean {
  const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
    context.getHandler(),
    context.getClass(),
  ]);
  if (!requiredRoles) return true;

  const req = context.switchToHttp().getRequest();
  const user = req.user;

  if (!user) {
    throw new ForbiddenException('User not found in request');
  }

  // If user.role is singular:
  if (!requiredRoles.includes(user.role)) {
    throw new ForbiddenException('Access denied');
  }

  // OR, if user.roles is an array:
  // if (!user.roles.some((r: Role) => requiredRoles.includes(r))) {
  //   throw new ForbiddenException('Access denied');
  // }

  return true;
}
    }
    /*  */
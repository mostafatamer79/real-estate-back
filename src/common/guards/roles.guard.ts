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
    return false;
  }

  // Always allow admins to bypass role checks
  if (user.role === Role.ADMIN) {
    return true;
  }

  // If user.role is singular:
  const hasRole = requiredRoles.includes(user.role);
  
  if (!hasRole) {
    console.warn(`RolesGuard: Access denied for user ${user.id} with role "${user.role}". Required roles:`, requiredRoles);
  }

  return hasRole;
}
    }
    /*  */

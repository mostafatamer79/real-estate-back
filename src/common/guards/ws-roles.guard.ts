// src/auth/ws-roles.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { ROLES_KEY } from '../decorators/roles.decorators';
import { Role } from '../../user/user-entity';
import { Socket } from 'socket.io';

@Injectable()
export class WsRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const client: Socket = context.switchToWs().getClient();
    const user = client.data?.user;

    if (!user) {
      throw new WsException('User not found');
    }

    // If user.role is singular
    if (!requiredRoles.includes(user.role)) {
      throw new WsException('Access denied');
    }

    // OR, if user.roles is an array (uncomment if needed):
    // if (!user.roles.some((r: Role) => requiredRoles.includes(r))) {
    //   throw new WsException('Access denied');
    // }

    return true;
  }
}
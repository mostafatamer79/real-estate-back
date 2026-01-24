// src/common/utils/request-user.util.ts
import { ForbiddenException } from '@nestjs/common';
import { Role } from '../../user/user-entity';

export function getUserFromRequest(req: any, allowedRoles?: Role[]) {
  const user = req.user;
  if (!user) throw new ForbiddenException('User not authenticated');
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new ForbiddenException('You do not have permission');
  }
  return user;
}

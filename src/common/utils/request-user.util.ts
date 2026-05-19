// src/common/utils/request-user.util.ts
import { ForbiddenException } from '@nestjs/common';

export function getUserFromRequest(req: any) {
  const user = req.user;
  if (!user) throw new ForbiddenException('User not authenticated');
  return user;
}

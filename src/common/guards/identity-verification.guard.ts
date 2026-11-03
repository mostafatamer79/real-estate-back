import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_UNVERIFIED_KEY } from '../decorators/allow-unverified.decorator';
import { Role } from '../../user/user-entity';

export const VERIFICATION_REQUIRED = {
  code: 'NAFATH_VERIFICATION_REQUIRED',
  message: 'Verify your identity through Nafath on your profile before performing this action.',
};

export function requireVerifiedIdentity(user: { role: Role; nafathVerifiedAt?: Date | string | null }) {
  // Deployment may temporarily defer the action gate until Elm enables the service.
  if (process.env.NAFATH_ENFORCE_VERIFICATION === 'false') return;
  if (user.role !== Role.ADMIN && !user.nafathVerifiedAt) {
    throw new ForbiddenException(VERIFICATION_REQUIRED);
  }
}

@Injectable()
export class IdentityVerificationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ method: string; user?: { role: Role; nafathVerifiedAt?: Date | string | null } }>();
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method) || !request.user) return true;
    if (this.reflector.getAllAndOverride<boolean>(ALLOW_UNVERIFIED_KEY, [context.getHandler(), context.getClass()])) return true;
    requireVerifiedIdentity(request.user);
    return true;
  }
}

import { ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

interface Invitation { purpose: 'provider-registration'; issuer: string; id: string; expiresAt: string }

@Injectable()
export class ProviderInvitationsService {
  constructor(private readonly config: ConfigService) {}

  private sign(payload: string): Buffer {
    const secret = this.config.get<string>('auth.secret');
    if (!secret) throw new ServiceUnavailableException('Provider invitations are unavailable');
    return createHmac('sha256', secret).update(`provider-invitation:${payload}`).digest();
  }

  create(issuer: string) {
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    const invitation: Invitation = { purpose: 'provider-registration', issuer, id: randomUUID(), expiresAt };
    const payload = Buffer.from(JSON.stringify(invitation)).toString('base64url');
    return { token: `${payload}.${this.sign(payload).toString('base64url')}`, expiresAt };
  }

  validate(token: unknown): Invitation {
    if (typeof token !== 'string' || token.length > 2048) throw new ForbiddenException('A valid provider invitation is required');
    const [payload, signature, extra] = token.split('.');
    if (!payload || !signature || extra || !/^[\w-]+$/.test(signature)) throw new ForbiddenException('Invalid provider invitation');
    const expected = this.sign(payload);
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new ForbiddenException('Invalid provider invitation');
    let invitation: Invitation;
    try { invitation = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Invitation; }
    catch { throw new ForbiddenException('Invalid provider invitation'); }
    if (invitation.purpose !== 'provider-registration' || !invitation.issuer || !invitation.id ||
        !Number.isFinite(Date.parse(invitation.expiresAt)) || Date.parse(invitation.expiresAt) <= Date.now()) {
      throw new ForbiddenException('Provider invitation expired or invalid');
    }
    return invitation;
  }
}

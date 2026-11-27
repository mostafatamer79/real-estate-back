import { ProviderInvitationsService } from './provider-invitations.service';
import { activateInvitedProvider } from './provider-activation';
import { ProviderService } from './provider.service';
import { ProviderController } from './provider.controller';
import { ALLOW_UNVERIFIED_KEY } from '../common/decorators/allow-unverified.decorator';
import type { ProviderProfile } from './provider-profile';

const profile: ProviderProfile = {
  invitationId: 'invite', invitedBy: 'admin', status: 'pending', kind: 'general',
  city: 'الرياض', requestedCategories: ['marketing'], categories: [],
  deliveryModes: ['online'], submittedAt: new Date().toISOString(),
};
describe('invited provider activation', () => {
  it('activates only invited pending providers after actual identity verification', () => {
    expect(activateInvitedProvider(profile, false)?.status).toBe('pending');
    expect(activateInvitedProvider({ ...profile, invitationId: undefined }, true)?.status).toBe('pending');
    expect(activateInvitedProvider(profile, true)).toMatchObject({ status: 'approved', categories: ['marketing'] });
    for (const status of ['suspended', 'rejected', 'approved'] as const) {
      const stored = { ...profile, status };
      expect(activateInvitedProvider(stored, true)).toBe(stored);
    }
    expect(activateInvitedProvider({ ...profile, archivedAt: '2026-01-01' }, true)?.status).toBe('pending');
    expect(activateInvitedProvider({ ...profile, licenseExpiryDate: '2001-01-01' }, true)?.status).toBe('pending');
  });
  it('does not overwrite existing commercial terms', () => {
    expect(activateInvitedProvider({ ...profile, agreementType: 'fixed', agreementValue: 20, minOffer: 50, maxOffer: 100 }, true))
      .toMatchObject({ agreementType: 'fixed', agreementValue: 20, minOffer: 50, maxOffer: 100 });
  });
  it('allows registration before verification but still gates provider business writes', () => {
    expect(Reflect.getMetadata(ALLOW_UNVERIFIED_KEY, ProviderController.prototype.apply)).toBe(true);
    expect(Reflect.getMetadata(ALLOW_UNVERIFIED_KEY, ProviderController.prototype.offer)).toBeUndefined();
  });
  it('rejects missing invitations and records identity-pending registration', async () => {
    const account = { id: 'p', isActive: true, providerProfile: null, nafathVerifiedAt: null };
    const invitations = new ProviderInvitationsService({ get: () => 'test-signing-key' } as never);
    const service = new ProviderService({ findOne: async () => account, update: async (_id, patch) => Object.assign(account, patch) } as never,
      {} as never, {} as never, { transaction: async fn => fn({ findOne: async () => account, update: async (_entity, _id, patch) => Object.assign(account, patch) }) } as never, { findOne: async () => null } as never, invitations);
    const input = { kind: 'general' as const, city: 'الرياض', requestedCategories: ['marketing'], deliveryModes: ['online' as const] };
    await expect(service.apply('p', input)).rejects.toThrow('invitation');
    const invite = invitations.create('admin');
    expect(await service.apply('p', { ...input, invitationToken: invite.token })).toMatchObject({ status: 'pending', categories: [], invitedBy: 'admin' });
    expect(account.nafathVerifiedAt).toBeNull();
  });
});

describe('signed provider invitations', () => {
  const service = new ProviderInvitationsService({ get: () => 'test-signing-key' } as never);
  it('rejects modified signatures, expired tokens, and tokens from a different secret', () => {
    const invite = service.create('admin');
    expect(service.validate(invite.token)).toMatchObject({ issuer: 'admin', expiresAt: invite.expiresAt });
    expect(() => service.validate(invite.token + 'x')).toThrow('invitation');
    expect(() => service.validate(undefined)).toThrow('invitation');
    const other = new ProviderInvitationsService({ get: () => 'other-key' } as never);
    expect(() => other.validate(invite.token)).toThrow('invitation');
    jest.useFakeTimers();
    try { jest.setSystemTime(Date.parse(invite.expiresAt) + 1); expect(() => service.validate(invite.token)).toThrow('expired'); }
    finally { jest.useRealTimers(); }
  });
});

import { providerLicenseExpired, validateProviderLicenseDates } from './provider-policy';
import type { ProviderProfile } from './provider-profile';

/** Identity proof comes exclusively from the server's verified Nafath callback. */
export function activateInvitedProvider(profile: ProviderProfile | null | undefined, verified: boolean): ProviderProfile | null | undefined {
  if (!verified || !profile?.invitationId || profile.status !== 'pending' || profile.archivedAt) return profile;
  validateProviderLicenseDates(profile);
  if (providerLicenseExpired(profile)) return profile;
  return {
    ...profile,
    status: 'approved',
    categories: [...profile.requestedCategories],
    agreementType: profile.agreementType ?? 'percentage',
    agreementValue: profile.agreementValue ?? 0,
    minOffer: profile.minOffer ?? 0,
    maxOffer: profile.maxOffer ?? 9999999999,
    reviewedAt: new Date().toISOString(),
  };
}

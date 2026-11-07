import { metadataRecord } from "./provider-metadata";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import type { ProviderProfile, DeliveryMode } from "./provider-profile";

export function validMoney(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 9999999999 &&
    Math.abs(value * 100 - Math.round(value * 100)) < 0.00001
  );
}
export function validateProviderReview(profile: Partial<ProviderProfile>) {
  if (
    !Array.isArray(profile.categories) ||
    !profile.categories.length ||
    profile.categories.length > 30 ||
    profile.categories.some(
      (c) => typeof c !== "string" || !/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(c),
    )
  )
    throw new BadRequestException("Select the allowed service categories");
  if (
    !["fixed", "percentage"].includes(profile.agreementType || "") ||
    !validMoney(profile.agreementValue)
  )
    throw new BadRequestException("Invalid provider agreement");
  if (profile.agreementType === "percentage" && profile.agreementValue > 100)
    throw new BadRequestException("Percentage must be between 0 and 100");
  if (
    !validMoney(profile.minOffer) ||
    !validMoney(profile.maxOffer) ||
    Number(profile.maxOffer) <= 0 ||
    Number(profile.minOffer) > Number(profile.maxOffer)
  )
    throw new BadRequestException("Invalid offer limits");
}
const cityKey = (city: string) =>
  city.trim().replace(/[أإآ]/g, "ا").replace(/\s+/g, " ").toLowerCase();
export function assertProviderCanOffer(
  profile: ProviderProfile | null | undefined,
  request: { category?: string | null; city: string },
  amount: number,
  mode: DeliveryMode,
  onlineAllCities = false,
) {
  if (profile?.status !== "approved")
    throw new ForbiddenException("Provider approval is required");
  validateProviderReview(profile);
  const category = request.category || "other";
  if (
    !profile.categories.some(
      (c) => c === category || category.startsWith(`${c}_`),
    )
  )
    throw new ForbiddenException("This service category is not permitted");
  if (!profile.deliveryModes.includes(mode))
    throw new BadRequestException("This delivery mode is not available");
  if (
    !validMoney(amount) ||
    amount <= 0 ||
    amount < Number(profile.minOffer) ||
    amount > Number(profile.maxOffer)
  )
    throw new BadRequestException(
      "Offer amount is outside the approved limits",
    );
  if (
    profile.agreementType === "fixed" &&
    Number(profile.agreementValue) > amount
  )
    throw new BadRequestException(
      "Offer must cover the agreed platform amount",
    );
  if (
    profile.kind === "notary" &&
    !(mode === "online" && onlineAllCities) &&
    (!cityKey(profile.city) || cityKey(profile.city) !== cityKey(request.city))
  )
    throw new ForbiddenException("This request is outside the notary city");
}
export function contactIsUnlocked(
  request: {
    id: string;
    userId: string | null;
    assignedAgentId?: string;
    adminAccepted: boolean;
    metadata?: unknown;
  },
  invoice: {
    referenceType: string;
    referenceId: string;
    userId: string;
    status: string;
    total?: number | string;
  } | null,
  ownerId: string,
) {
  return (
    request.userId === ownerId &&
    request.adminAccepted === true &&
    Boolean(request.assignedAgentId) &&
    metadataRecord(metadataRecord(request.metadata).providerSelection)
      .providerId === request.assignedAgentId &&
    invoice?.status === "paid" &&
    invoice.referenceType === "ServiceRequest" &&
    invoice.referenceId === request.id &&
    invoice.userId === ownerId &&
    Number(invoice.total) ===
      metadataRecord(metadataRecord(request.metadata).providerSelection)
        .chargedAmount
  );
}
export function cleanProviderMetadata(
  input: unknown,
  stored?: Record<string, unknown> | null,
): Record<string, unknown> {
  const safe =
    input && typeof input === "object" && !Array.isArray(input)
      ? { ...input }
      : {};
  for (const key of ["providerOffers", "providerSelection"]) {
    delete safe[key];
    if (stored?.[key] !== undefined) safe[key] = stored[key];
  }
  return safe;
}


export function validLicenseDocument(value: string): boolean {
  if (/^\/uploads\/[a-z0-9_-]+\/[a-f0-9-]+\.(?:pdf|png|jpe?g|webp)$/i.test(value)) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

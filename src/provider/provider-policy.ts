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
export function validLicenseDate(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value.startsWith("0000")
  )
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function validateProviderLicenseDates(
  profile: Pick<
    Partial<ProviderProfile>,
    "licenseIssueDate" | "licenseExpiryDate"
  >,
) {
  for (const value of [profile.licenseIssueDate, profile.licenseExpiryDate]) {
    if (value !== undefined && !validLicenseDate(value))
      throw new BadRequestException(
        "Invalid license date; use a real Gregorian date (YYYY-MM-DD)",
      );
  }
  if (
    profile.licenseIssueDate &&
    profile.licenseExpiryDate &&
    profile.licenseIssueDate > profile.licenseExpiryDate
  )
    throw new BadRequestException(
      "The license expiry date must be on or after its issue date",
    );
}

export function providerLicenseExpired(
  profile: Pick<Partial<ProviderProfile>, "licenseExpiryDate">,
  now = new Date(),
): boolean {
  if (!validLicenseDate(profile.licenseExpiryDate)) return false;
  // Saudi calendar day: the license remains valid throughout its expiry date.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)!.value;
  return (
    profile.licenseExpiryDate <
    `${part("year")}-${part("month")}-${part("day")}`
  );
}

export function validateProviderReview(profile: Partial<ProviderProfile>) {
  validateProviderLicenseDates(profile);
  if (providerLicenseExpired(profile))
    throw new BadRequestException(
      "The provided license has expired; renew it before approval or new offers",
    );
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
export const cityKey = (city: string) =>
  city.trim().replace(/[أإآ]/g, "ا").replace(/\s+/g, " ").toLowerCase();
export function providerDeliveryModes(
  profile: ProviderProfile,
  request: { city: string; metadata?: unknown },
  onlineAllCities = false,
): DeliveryMode[] {
  const requested = metadataRecord(request.metadata).requestedDeliveryMode;
  return profile.deliveryModes.filter(
    (mode) =>
      (!requested || requested === "any" || requested === mode) &&
      (profile.kind !== "notary" ||
        (mode === "online" && onlineAllCities) ||
        (Boolean(cityKey(profile.city)) &&
          cityKey(profile.city) === cityKey(request.city))),
  );
}
export function assertProviderCanOffer(
  profile: ProviderProfile | null | undefined,
  request: { category?: string | null; city: string; metadata?: unknown },
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
  if (!providerDeliveryModes(profile, request, onlineAllCities).includes(mode))
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
  if (
    /^\/uploads\/[a-z0-9_-]+\/[a-f0-9-]+\.(?:pdf|png|jpe?g|webp)$/i.test(value)
  )
    return true;
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

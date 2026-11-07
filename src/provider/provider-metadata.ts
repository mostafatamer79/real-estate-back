import type { ProviderOffer, DeliveryMode } from "./provider-profile";

export interface ProviderSelection {
  providerId: string;
  deliveryMode: DeliveryMode;
  amount: number;
  platformFee: number;
  acceptedAt: string;
  invoiceId: string;
  chargedAmount: number;
}
export interface ProviderRequestMetadata extends Record<string, unknown> {
  providerOffers?: Record<string, ProviderOffer>;
  providerSelection?: ProviderSelection;
}
export function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
const money = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
export function providerMetadata(value: unknown): ProviderRequestMetadata {
  const source = metadataRecord(value);
  const result: ProviderRequestMetadata = { ...source };
  delete result.providerOffers;
  delete result.providerSelection;
  const offers: Record<string, ProviderOffer> = {};
  for (const [key, raw] of Object.entries(
    metadataRecord(source.providerOffers),
  )) {
    const offer = metadataRecord(raw);
    if (
      typeof offer.providerId !== "string" ||
      offer.providerId !== key ||
      !money(offer.amount) ||
      !money(offer.commission) ||
      (offer.deliveryMode !== "online" && offer.deliveryMode !== "in_person") ||
      typeof offer.createdAt !== "string"
    )
      continue;
    offers[key] = {
      providerId: offer.providerId,
      amount: offer.amount,
      commission: offer.commission,
      deliveryMode: offer.deliveryMode,
      createdAt: offer.createdAt,
      note: typeof offer.note === "string" ? offer.note : "",
    };
  }
  if (Object.keys(offers).length) result.providerOffers = offers;
  const selection = metadataRecord(source.providerSelection);
  if (
    typeof selection.providerId === "string" &&
    typeof selection.invoiceId === "string" &&
    /^[0-9a-f-]{36}$/i.test(selection.invoiceId) &&
    money(selection.amount) &&
    money(selection.platformFee) &&
    money(selection.chargedAmount) &&
    typeof selection.acceptedAt === "string" &&
    (selection.deliveryMode === "online" ||
      selection.deliveryMode === "in_person")
  ) {
    result.providerSelection = {
      providerId: selection.providerId,
      invoiceId: selection.invoiceId,
      amount: selection.amount,
      platformFee: selection.platformFee,
      chargedAmount: selection.chargedAmount,
      acceptedAt: selection.acceptedAt,
      deliveryMode: selection.deliveryMode,
    };
  }
  return result;
}

export type DeliveryMode = "online" | "in_person";
export interface ProviderProfile {
  status: "pending" | "approved" | "rejected" | "suspended";
  kind: "general" | "notary";
  city: string;
  deliveryModes: DeliveryMode[];
  requestedCategories: string[];
  categories: string[];
  licenseNumber?: string;
  licenseDocument?: string;
  notes?: string;
  reviewNote?: string;
  agreementType?: "fixed" | "percentage";
  agreementValue?: number;
  minOffer?: number;
  maxOffer?: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
export interface ProviderOffer {
  providerId: string;
  amount: number;
  deliveryMode: DeliveryMode;
  note: string;
  createdAt: string;
  commission: number;
}

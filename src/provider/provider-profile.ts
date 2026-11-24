export type DeliveryMode = "online" | "in_person";
export interface ProviderProfile {
  status: "pending" | "approved" | "rejected" | "suspended";
  kind: "general" | "notary";
  city: string;
  registrationAnswers?: Record<string, string>;
  registrationFields?: { id: string; label: string }[];
  specializationId?: string;
  specializationTitle?: string;
  archivedAt?: string;
  deliveryModes: DeliveryMode[];
  requestedCategories: string[];
  categories: string[];
  licenseNumber?: string;
  licenseDocument?: string;
  /** Gregorian calendar dates (YYYY-MM-DD); absent on legacy profiles. */
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
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

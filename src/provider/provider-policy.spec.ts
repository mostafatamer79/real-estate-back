import type { ProviderProfile } from "./provider-profile";
import {
  assertProviderCanOffer,
  validateProviderReview,
  contactIsUnlocked,
  cleanProviderMetadata,
  validLicenseDocument,
} from "./provider-policy";

describe("provider offers and contact boundaries", () => {
  const profile: ProviderProfile = {
    requestedCategories: ["legal"],
    submittedAt: "2026-11-06T00:00:00Z",
    status: "approved",
    kind: "notary",
    city: "مكة المكرمة",
    categories: ["legal"],
    deliveryModes: ["online", "in_person"],
    minOffer: 5,
    maxOffer: 500,
    agreementType: "percentage",
    agreementValue: 10,
  };
  const request = {
    category: "legal",
    city: "مكة المكرمة",
    serviceType: "توثيق",
  };
  it("allows approved categories and enforces amount bounds and service mode", () => {
    expect(() =>
      assertProviderCanOffer(profile, request, 100, "in_person"),
    ).not.toThrow();
    for (const amount of [0, 4, 501, NaN, Infinity, 5.123])
      expect(() =>
        assertProviderCanOffer(profile, request, amount, "online"),
      ).toThrow();
    expect(() =>
      assertProviderCanOffer(
        profile,
        { ...request, category: "marketing" },
        100,
        "online",
      ),
    ).toThrow();
    expect(() =>
      assertProviderCanOffer(
        { ...profile, status: "pending" },
        request,
        100,
        "online",
      ),
    ).toThrow();
    expect(() =>
      assertProviderCanOffer(
        { ...profile, deliveryModes: ["online"] },
        request,
        100,
        "in_person",
      ),
    ).toThrow();
  });
  it("limits notary requests to the same city unless online scope is explicitly expanded", () => {
    const other = { ...request, city: "الرياض" };
    expect(() =>
      assertProviderCanOffer(profile, other, 100, "in_person", true),
    ).toThrow();
    expect(() =>
      assertProviderCanOffer(profile, other, 100, "online"),
    ).toThrow();
    expect(() =>
      assertProviderCanOffer(profile, other, 100, "online", true),
    ).not.toThrow();
  });
  it("requires a coherent admin agreement and rejects unbounded/malformed offers", () => {
    expect(() => validateProviderReview(profile)).not.toThrow();
    expect(() =>
      validateProviderReview({ ...profile, minOffer: 600 }),
    ).toThrow();
    expect(() =>
      validateProviderReview({ ...profile, agreementValue: 101 }),
    ).toThrow();
    expect(() =>
      validateProviderReview({ ...profile, categories: [] }),
    ).toThrow();
  });
  it("reveals contact only for the accepted assignee and a matching paid invoice", () => {
    const request = {
      id: "request",
      userId: "owner",
      assignedAgentId: "provider",
      adminAccepted: true,
      metadata: {
        providerSelection: { providerId: "provider", chargedAmount: 25 },
      },
    };
    const invoice = {
      referenceType: "ServiceRequest",
      referenceId: "request",
      userId: "owner",
      status: "paid",
      total: 25,
    };
    expect(contactIsUnlocked(request, invoice, "owner")).toBe(true);
    for (const patch of [
      { total: 1 },
      { status: "unpaid" },
      { status: "cancelled" },
      { referenceId: "other" },
      { userId: "other" },
    ])
      expect(
        contactIsUnlocked(request, { ...invoice, ...patch }, "owner"),
      ).toBe(false);
    expect(contactIsUnlocked(request, invoice, "stranger")).toBe(false);
    expect(
      contactIsUnlocked({ ...request, adminAccepted: false }, invoice, "owner"),
    ).toBe(false);
  });
  it("cannot forge or overwrite server provider offers and acceptance through generic metadata", () => {
    expect(
      cleanProviderMetadata({
        providerOffers: { fake: {} },
        providerSelection: { providerId: "fake" },
        notes: "ok",
      }),
    ).toEqual({ notes: "ok" });
    expect(
      cleanProviderMetadata(
        { providerSelection: { providerId: "fake" } },
        { providerSelection: { providerId: "real" } },
      ),
    ).toEqual({ providerSelection: { providerId: "real" } });
  });
});


describe("uploaded license URL compatibility", () => {
  it("accepts the relative URL returned by the real upload service", () => {
    expect(validLicenseDocument("/uploads/profile-images/12345678-1234-1234-1234-123456789abc.pdf")).toBe(true);
    expect(validLicenseDocument("https://example.test/license.pdf")).toBe(true);
  });
  it("rejects traversal, protocol-relative and executable URLs", () => {
    for (const value of ["/uploads/../private.pdf", "//example.test/license.pdf", "javascript:alert(1)", "/etc/passwd"]) expect(validLicenseDocument(value)).toBe(false);
  });
});

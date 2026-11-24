import { ProviderService } from "./provider.service";
import {
  assertProviderCanOffer,
  validateProviderReview,
} from "./provider-policy";
import type { ProviderProfile } from "./provider-profile";
import type { ProviderApplicationDto } from "./provider.dto";
const approved: ProviderProfile = {
  status: "approved",
  kind: "general",
  city: "الرياض",
  requestedCategories: ["marketing"],
  categories: ["marketing"],
  deliveryModes: ["online"],
  agreementType: "percentage",
  agreementValue: 10,
  minOffer: 1,
  maxOffer: 500,
  submittedAt: "2026-01-01",
};
const application: ProviderApplicationDto = {
  kind: "general",
  city: "الرياض",
  requestedCategories: ["marketing"],
  deliveryModes: ["online"],
};
const review = {
  status: "approved" as const,
  categories: ["marketing"],
  agreementType: "percentage" as const,
  agreementValue: 10,
  minOffer: 1,
  maxOffer: 500,
};
function setup(profile: unknown = null) {
  const user = {
    id: "provider",
    isActive: false,
    nafathVerifiedAt: null,
    providerProfile: profile,
  };
  const update = jest.fn(async (_id, patch) => Object.assign(user, patch));
  const transaction = jest.fn(async (fn) =>
    fn({ update: jest.fn(), save: jest.fn() }),
  );
  const service = new ProviderService(
    { findOne: async () => user, update } as never,
    {} as never,
    {} as never,
    { transaction } as never,
    { findOne: async () => null } as never,
  );
  return { service, user, update, transaction };
}
describe("provider license dates", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-11-12T12:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());
  it("persists Gregorian dates without changing activation or identity", async () => {
    const { service, user } = setup();
    expect(
      await service.apply("provider", {
        ...application,
        licenseIssueDate: "2024-02-29",
        licenseExpiryDate: "2027-02-28",
      } as ProviderApplicationDto),
    ).toMatchObject({
      status: "pending",
      licenseIssueDate: "2024-02-29",
      licenseExpiryDate: "2027-02-28",
    });
    expect(user.isActive).toBe(false);
    expect(user.nafathVerifiedAt).toBeNull();
  });
  it.each([
    "2026-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-1-01",
    "0000-01-01",
    "2026-01-01T00:00:00Z",
    "",
    null,
    20261112,
  ])("rejects invalid supplied dates: %s", async (value) => {
    const { service, update } = setup();
    for (const key of ["licenseIssueDate", "licenseExpiryDate"])
      await expect(
        service.apply("provider", { ...application, [key]: value }),
      ).rejects.toThrow("license");
    expect(update).not.toHaveBeenCalled();
  });
  it("validates merged dates and preserves omitted dates on resubmission", async () => {
    const { service } = setup({
      status: "pending",
      licenseIssueDate: "2026-01-01",
      licenseExpiryDate: "2027-01-01",
    });
    await expect(
      service.apply("provider", {
        ...application,
        licenseExpiryDate: "2025-01-01",
      } as ProviderApplicationDto),
    ).rejects.toThrow("license");
    expect(await service.apply("provider", application)).toMatchObject({
      licenseIssueDate: "2026-01-01",
      licenseExpiryDate: "2027-01-01",
    });
  });
  it("accepts missing and individual dates for legacy compatibility", async () => {
    await expect(
      setup().service.apply("provider", application),
    ).resolves.toMatchObject({ status: "pending" });
    for (const dates of [
      {},
      { licenseIssueDate: "2026-01-01" },
      { licenseExpiryDate: "2027-01-01" },
    ]) {
      expect(() =>
        validateProviderReview({ ...approved, ...dates }),
      ).not.toThrow();
      expect(() =>
        assertProviderCanOffer(
          { ...approved, ...dates },
          { city: "الرياض", category: "marketing" },
          100,
          "online",
        ),
      ).not.toThrow();
    }
  });
  it("blocks expired approval before writes and still allows rejection", async () => {
    const { service, transaction } = setup({
      ...approved,
      status: "pending",
      licenseExpiryDate: "2026-11-11",
    });
    await expect(service.review("provider", review, "admin")).rejects.toThrow(
      "expired",
    );
    expect(transaction).not.toHaveBeenCalled();
    await expect(
      service.review(
        "provider",
        { status: "rejected", reviewNote: "Expired license" },
        "admin",
      ),
    ).resolves.toMatchObject({ status: "rejected" });
  });
  it("allows expiry day and blocks new offers at Saudi midnight", () => {
    const profile = {
      ...approved,
      licenseExpiryDate: "2026-11-12",
    } as ProviderProfile;
    const offer = () =>
      assertProviderCanOffer(
        profile,
        { city: "الرياض", category: "marketing" },
        100,
        "online",
      );
    expect(offer).not.toThrow();
    jest.setSystemTime(new Date("2026-11-12T21:00:00Z"));
    expect(offer).toThrow("expired");
  });
  it("blocks the offer service before saving an expired provider offer", async () => {
    const user = {
      id: "provider",
      providerProfile: { ...approved, licenseExpiryDate: "2026-11-11" },
    };
    const manager = {
      findOne: async () => ({
        id: "request",
        userId: "customer",
        category: "marketing",
        city: "الرياض",
        status: "pending",
        metadata: {},
      }),
      save: jest.fn(),
    };
    const service = new ProviderService(
      { findOne: async () => user } as never,
      {} as never,
      {} as never,
      { transaction: async (fn) => fn(manager) } as never,
      { findOne: async () => null } as never,
    );
    await expect(
      service.offer("request", "provider", {
        amount: 100,
        deliveryMode: "online",
      }),
    ).rejects.toThrow("expired");
    expect(manager.save).not.toHaveBeenCalled();
  });
  it("blocks malformed stored dates for approval and offers", () => {
    const profile = {
      ...approved,
      licenseExpiryDate: "2026-02-30",
    } as ProviderProfile;
    expect(() => validateProviderReview(profile)).toThrow("license");
    expect(() =>
      assertProviderCanOffer(
        profile,
        { city: "الرياض", category: "marketing" },
        100,
        "online",
      ),
    ).toThrow("license");
  });
});

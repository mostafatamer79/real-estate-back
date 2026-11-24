import {
  providerSpecializations,
  providerRegistrationFields,
} from "./provider-catalog";
describe("administrator-managed provider types", () => {
  it("preserves stable IDs, labels and category scopes without creating account grants", () =>
    expect(
      providerSpecializations([
        {
          id: "contractor",
          title: " مقاول ",
          categories: ["construction", "construction"],
          enabled: true,
        },
      ]),
    ).toEqual([
      {
        id: "contractor",
        title: "مقاول",
        categories: ["construction"],
        enabled: true,
      },
    ]));
  it.each([
    [{ id: "x", title: "", categories: [], enabled: true }],
    [{ id: "x", title: "X", categories: [], enabled: "true" }],
    [
      { id: "x", title: "X", categories: [], enabled: true },
      { id: "x", title: "Y", categories: [], enabled: true },
    ],
  ])("rejects invalid and duplicate configuration", (row) =>
    expect(() => providerSpecializations(row)).toThrow(),
  );
});

describe("provider registration fields", () => {
  it("accepts configurable required field with stable ID and rejects privileged object shapes", () => {
    expect(
      providerRegistrationFields([
        {
          id: "experience",
          label: "الخبرة",
          type: "number",
          enabled: true,
          required: true,
          categories: ["construction"],
        },
      ]),
    ).toHaveLength(1);
    expect(() =>
      providerRegistrationFields([
        {
          id: "constructor",
          label: "حقل",
          type: "text",
          enabled: true,
          required: false,
          categories: [],
        },
      ]),
    ).toThrow();
  });
});

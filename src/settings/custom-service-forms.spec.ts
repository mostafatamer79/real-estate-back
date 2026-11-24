import { SettingsService } from "./settings.service";
describe("administrator-created service category forms", () => {
  const setup = () => {
    const values = new Map([
      [
        "custom_service_categories",
        JSON.stringify([
          { id: "consulting", title: "استشارات", status: "enabled" },
        ]),
      ],
    ]);
    const service = Object.create(SettingsService.prototype) as SettingsService;
    Object.assign(service, {
      findOne: async (key) =>
        values.has(key) ? { value: values.get(key) } : null,
      setSetting: async (key, value) => {
        values.set(key, value);
        return { key, value };
      },
    });
    return { service };
  };
  it("allows adding, resolving and resetting fields for a registered custom category", async () => {
    const { service } = setup();
    const def = {
      version: 1,
      fields: [
        {
          id: "details",
          type: "text",
          label: "تفاصيل",
          target: "metadata.details",
          required: true,
        },
      ],
    };
    await service.saveServiceForm("consulting", def);
    expect(await service.resolveServiceForm("consulting")).toEqual(def);
    expect((await service.resolveAllServiceForms()).consulting).toEqual(def);
    expect(
      (await service.resetServiceForm("consulting")).fields.length,
    ).toBeGreaterThan(0);
  });
  it("does not create arbitrary settings keys for unregistered category IDs", async () => {
    const { service } = setup();
    await expect(service.saveServiceForm("unknown", {})).rejects.toThrow(
      "Unknown",
    );
  });
});

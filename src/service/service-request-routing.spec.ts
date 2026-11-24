import { ServiceRequestService } from "./service-request.service";
import { Role } from "../user/user-entity";
import { InvoiceStatus } from "../financial/entities/invoice.entity";

describe("service submission references and department routing", () => {
  it.each([
    ["postPurchase", "real_estate", false],
    ["construction", "real_estate", false],
    ["legal", "legal", true],
    ["marketing", "marketing", true],
  ])(
    "keeps %s request identity and its department/invoice workflow",
    async (category, department, manualPricing) => {
      const repository = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn((value) => value),
        save: jest.fn(async (value) => ({ ...value, id: "created-request" })),
      };
      const invoices = {
        create: jest.fn((value) => value),
        save: jest.fn(async (value) => value),
      };
      const users = {
        find: jest.fn().mockResolvedValue([]),
        createQueryBuilder: jest.fn(),
      };
      const settings = { findOne: jest.fn().mockResolvedValue(null) };
      const service = new ServiceRequestService(
        repository as never,
        users as never,
        invoices as never,
        settings as never,
        {} as never,
        {} as never,
      );
      // Isolate delivery side effects; creation and invoice linking remain real.
      jest
        .spyOn(service as never, "notifyAdminsOfNewRequest")
        .mockResolvedValue(undefined as never);
      jest
        .spyOn(service as never, "notifyDepartmentOfNewRequest")
        .mockResolvedValue(undefined as never);
      const result = await service.create(
        {
          category,
          targetDepartment: ["legal", "marketing"].includes(category)
            ? "finance"
            : undefined,
          serviceType: "اختبار",
          clientName: "عميل",
          phone: "0500000000",
          city: "الرياض",
          district: "النرجس",
          quantity: 1,
        } as never,
        { id: "owner", role: Role.ADMIN } as never,
      );
      expect(result).toMatchObject({
        id: "created-request",
        userId: "owner",
        category,
        targetDepartment: department,
        invoiceSent: !manualPricing,
      });
      if (manualPricing) expect(invoices.save).not.toHaveBeenCalled();
      else
        expect(invoices.save).toHaveBeenCalledWith(
          expect.objectContaining({
            referenceType: "ServiceRequest",
            referenceId: result.id,
            userId: "owner",
            status: InvoiceStatus.UNPAID,
          }),
        );
    },
  );
});

import { FinancialService } from "./financial.service";

describe("wallet invoice service details", () => {
  it("loads only referenced service requests belonging to the invoice owner and exposes display fields", async () => {
    const invoices = [
      {
        id: "invoice",
        userId: "owner",
        referenceType: "ServiceRequest",
        referenceId: "request",
        total: 105,
      },
      {
        id: "subscription",
        userId: "owner",
        referenceType: "Subscription",
        referenceId: "sub",
      },
      {
        id: "missing",
        userId: "owner",
        referenceType: "ServiceRequest",
        referenceId: "missing-request",
      },
    ];
    const requests = {
      find: jest
        .fn()
        .mockResolvedValue([
          {
            id: "request",
            userId: "owner",
            clientName: "عميل",
            phone: "0500000000",
            city: "الرياض",
            district: "النرجس",
            category: "marketing",
            serviceType: "تصوير",
            quantity: 2,
            price: 50,
          },
        ]),
    };
    const invoiceRepo = { find: jest.fn().mockResolvedValue(invoices) };
    const service = new FinancialService(
      {} as never,
      invoiceRepo as never,
      {} as never,
      {} as never,
      {} as never,
      requests as never,
      {} as never,
      {} as never,
    );
    const result = await service.getUserInvoices("owner");
    expect(invoiceRepo.find).toHaveBeenCalledWith({
      where: { userId: "owner" },
      order: { createdAt: "DESC" },
    });
    expect(requests.find).toHaveBeenCalledTimes(1);
    expect(requests.find.mock.calls[0][0].where.userId).toBe("owner");
    expect(requests.find.mock.calls[0][0].where.id.value).toEqual([
      "request",
      "missing-request",
    ]);
    expect(requests.find.mock.calls[0][0].select).not.toHaveProperty(
      "metadata",
    );
    expect(result[0]).toMatchObject({
      id: "invoice",
      total: 105,
      serviceRequest: { clientName: "عميل", quantity: 2 },
    });
    expect(result[1]).not.toHaveProperty("serviceRequest");
    expect(result[2]).not.toHaveProperty("serviceRequest");
  });
  it("does not query services for invoices without service references", async () => {
    const requests = { find: jest.fn() };
    const service = new FinancialService(
      {} as never,
      { find: async () => [] } as never,
      {} as never,
      {} as never,
      {} as never,
      requests as never,
      {} as never,
      {} as never,
    );
    expect(await service.getUserInvoices("owner")).toEqual([]);
    expect(requests.find).not.toHaveBeenCalled();
  });
});

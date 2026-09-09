import { ServiceRequestService } from './service-request.service';
import {
  ClientDecision,
  PaidStatus,
  ServiceRequest,
  ServiceStatus,
  TargetDepartment,
} from './service-request.entity';
import { Role } from '../user/user-entity';
import { InvoiceStatus } from '../financial/entities/invoice.entity';

describe('ServiceRequestService department pricing', () => {
  it('creates a wallet invoice immediately when the target department prices a request', async () => {
    const request = {
      id: 'request-id',
      userId: 'client-id',
      serviceType: 'Campaign',
      category: 'marketing',
      targetDepartment: TargetDepartment.MARKETING,
      status: ServiceStatus.PENDING,
      paymentStatus: PaidStatus.UNPAID,
      invoiceSent: false,
      adminAccepted: false,
      clientDecision: ClientDecision.PENDING,
      departmentPrices: {},
      user: { id: 'client-id' },
    } as ServiceRequest;

    const serviceRequestRepository = {
      findOne: jest.fn().mockResolvedValue(request),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const invoiceRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockImplementation(async (value) => ({ id: 'invoice-id', ...value })),
    };
    const userRepository = {};
    const settingsService = { findOne: jest.fn().mockResolvedValue(null) };
    const mailService = {};
    const notificationService = { create: jest.fn().mockResolvedValue(undefined) };
    const service = new ServiceRequestService(
      serviceRequestRepository as any,
      userRepository as any,
      invoiceRepository as any,
      settingsService as any,
      mailService as any,
      notificationService as any,
    );

    const departmentUser = {
      id: 'marketing-user-id',
      role: Role.MARKETING,
      departments: ['marketing'],
      departmentPermissions: {},
    } as any;

    const result = await service.addDepartmentPrice(
      request.id,
      750,
      'Includes campaign setup',
      departmentUser,
    );

    expect(result.price).toBe(750);
    expect(result.invoiceSent).toBe(true);
    expect(result.clientDecision).toBe(ClientDecision.ACCEPTED);
    expect(result.adminAccepted).toBe(true);
    expect(invoiceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 750,
        total: 750,
        status: InvoiceStatus.UNPAID,
        referenceType: 'ServiceRequest',
        referenceId: request.id,
        userId: request.userId,
      }),
    );
    expect(invoiceRepository.save).toHaveBeenCalled();
  });
});

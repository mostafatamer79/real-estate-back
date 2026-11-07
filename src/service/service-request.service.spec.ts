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

describe('service catalog availability', () => {
  it('blocks a deleted catalog item even if a client submits its old value directly', async () => {
    const service: any = Object.create(ServiceRequestService.prototype);
    service.settingsService = { findOne: jest.fn(async key => key === 'custom_service_catalog' ? { value: JSON.stringify([{ category: 'postPurchase', name: 'الغاز', deleted: true, status: 'disabled' }]) } : null) };
    service.serviceRequestRepository = { create: jest.fn() };
    await expect(service.create({ category: 'postPurchase', serviceType: 'الغاز', quantity: 1 }, { id: 'owner', role: Role.USER })).rejects.toThrow('الخدمة');
    expect(service.serviceRequestRepository.create).not.toHaveBeenCalled();
  });
});

describe('service request catalog browsing scope', () => {
  const setup = () => {
    const query = { leftJoinAndSelect: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), take: jest.fn().mockReturnThis(), getManyAndCount: jest.fn().mockResolvedValue([[],0]) };
    const service: any = Object.create(ServiceRequestService.prototype);
    service.serviceRequestRepository = {createQueryBuilder: jest.fn().mockReturnValue(query)};
    return {service,query};
  };
  it('includes legal and marketing in catalog scope while keeping the general center unchanged', async () => {
    const {service,query} = setup();
    await service.findAll({id:'admin',role:Role.ADMIN},1,200,false,undefined,undefined,true);
    expect(query.andWhere).not.toHaveBeenCalled();
    await service.findAll({id:'admin',role:Role.ADMIN},1,200);
    expect(query.andWhere).toHaveBeenCalledWith(expect.stringContaining('deptOnlyCategories'),expect.any(Object));
  });
  it('catalog scope retains customer ownership restrictions', async () => {
    const {service,query} = setup();
    await service.findAll({id:'owner',role:Role.USER},1,200,false,undefined,undefined,true);
    expect(query.andWhere).toHaveBeenCalledWith('service.userId = :userId',{userId:'owner'});
  });
});

describe('deleted legal parent service', () => {
  it('blocks a child request submitted directly after its legal branch is deleted', async () => {
    const service: any = Object.create(ServiceRequestService.prototype);
    service.settingsService = { findOne: jest.fn(async key => key === 'custom_service_catalog' ? { value: JSON.stringify([{category:'legal',name:'التوثيق',deleted:true,status:'disabled'}]) } : null) };
    service.serviceRequestRepository = { create: jest.fn() };
    await expect(service.create({category:'legal',serviceType:'توثيق صك الملكية',metadata:{deedInfo:{}},quantity:1},{id:'owner',role:Role.USER})).rejects.toThrow('الخدمة');
    expect(service.serviceRequestRepository.create).not.toHaveBeenCalled();
  });
});

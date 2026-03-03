import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Subscription, SubscriptionType, PaymentMethod } from './subscription.entity';
import { User } from '../user/user-entity';
import { Property } from '../property/entities/property.entity';
import { Unit } from '../property/entities/unit.entity';
import { ManagementPackageService } from './management-package/management-package.service';
import { ManagementPackage } from './management-package/management-package.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let packageService: ManagementPackageService;

  const mockSubscriptionRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((sub) => Promise.resolve({ id: 'sub-id', ...sub })),
  };

  const mockUserRepository = {};
  const mockPropertyRepository = {
    findOne: jest.fn().mockResolvedValue({ id: 'prop-id' }),
  };
  const mockUnitRepository = {
    findOne: jest.fn().mockResolvedValue({ id: 'unit-id' }),
  };

  const mockPackageService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Property),
          useValue: mockPropertyRepository,
        },
        {
          provide: getRepositoryToken(Unit),
          useValue: mockUnitRepository,
        },
        {
          provide: ManagementPackageService,
          useValue: mockPackageService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    packageService = module.get<ManagementPackageService>(ManagementPackageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should calculate yearly price with discount correctly', async () => {
      const mockPackage = {
        id: 'pkg-id',
        yearlyPrice: 1000,
        monthlyPrice: 100,
        discount: 10,
      } as ManagementPackage;

      mockPackageService.findOne.mockResolvedValue(mockPackage);

      const dto: CreateSubscriptionDto = {
        subscriptionType: SubscriptionType.YEARLY,
        packageId: 'pkg-id',
        propertyId: 'prop-id',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        startDate: new Date(),
        amount: 0, // Should be overwritten
      };

      const result = await service.create('user-id', dto);

      expect(packageService.findOne).toHaveBeenCalledWith('pkg-id');
      // Base: 1000, Discount: 10% (100) => Final: 900
      expect(result.amount).toBe(900);
    });

    it('should calculate monthly price with discount correctly', async () => {
      const mockPackage = {
        id: 'pkg-id',
        yearlyPrice: 1000,
        monthlyPrice: 100,
        discount: 10,
      } as ManagementPackage;

      mockPackageService.findOne.mockResolvedValue(mockPackage);

      const dto: CreateSubscriptionDto = {
        subscriptionType: SubscriptionType.MONTHLY,
        packageId: 'pkg-id',
        propertyId: 'prop-id',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        startDate: new Date(),
        amount: 0, // Should be overwritten
      };

      const result = await service.create('user-id', dto);

      expect(packageService.findOne).toHaveBeenCalledWith('pkg-id');
      // Base: 100, Discount: 10% (10) => Final: 90
      expect(result.amount).toBe(90);
    });

    it('should calculate price correctly when no discount', async () => {
        const mockPackage = {
          id: 'pkg-id',
          yearlyPrice: 1000,
          monthlyPrice: 100,
          discount: 0,
        } as ManagementPackage;
  
        mockPackageService.findOne.mockResolvedValue(mockPackage);
  
        const dto: CreateSubscriptionDto = {
          subscriptionType: SubscriptionType.YEARLY,
          packageId: 'pkg-id',
          propertyId: 'prop-id',
          paymentMethod: PaymentMethod.CREDIT_CARD,
          startDate: new Date(),
          amount: 0,
        };
  
        const result = await service.create('user-id', dto);
  
        expect(result.amount).toBe(1000);
      });
  });
});

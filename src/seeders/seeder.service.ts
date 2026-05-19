import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role, Permission } from '../user/user-entity';
import { SettingsService } from '../settings/settings.service';
import { Property, PropertyType } from '../property/entities/property.entity';
import { FinancialTransaction, TransactionType, TransactionStatus, PaymentMethod } from '../financial/entities/financial-transaction.entity';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(FinancialTransaction)
    private readonly transactionRepository: Repository<FinancialTransaction>,
    private readonly settingsService: SettingsService,
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      await this.seed();
    }
  }

  async seed() {
    this.logger.log('Starting Seeding...');

    // Seed default settings
    await this.settingsService.seedDefaultSettings();
    this.logger.log('Seeded default settings.');

    // Seed default permissions
    const defaultPermissions = [
      'user.view', 'user.manage',
      'property.view', 'property.manage',
      'order.view', 'order.manage',
      'marketing.view', 'marketing.manage',
      'financial.view', 'financial.manage',
      'legal.view', 'legal.manage',
    ];

    const seededPermissions: Permission[] = [];
    for (const permName of defaultPermissions) {
      let permission = await this.permissionRepository.findOne({ where: { name: permName } });
      if (!permission) {
        permission = this.permissionRepository.create({ name: permName });
        permission = await this.permissionRepository.save(permission);
        this.logger.log(`Seeded permission: ${permName}`);
      }
      seededPermissions.push(permission);
    }

    const roles = Object.values(Role);
    let adminUser: User | null = null;

    for (const role of roles) {
      const email = `${role}@gmail.com`;
      const phone = `123456789${roles.indexOf(role)}`;
      let user = await this.userRepository.findOne({
        where: [{ email }, { phone }],
      });

      if (!user) {
        // Define department permissions based on role
        const deptPerms: any = {
          offers: role === Role.ADMIN ? 'manage' : 'none',
          orders: role === Role.ADMIN ? 'manage' : 'none',
          marketing: role === Role.ADMIN ? 'manage' : 'none',
          finance: role === Role.ADMIN ? 'manage' : 'none',
          properties: role === Role.ADMIN ? 'manage' : 'none',
          legal: role === Role.ADMIN ? 'manage' : 'none',
          employees: role === Role.ADMIN,
        };

        const depts: string[] = [];

        // Assign specific departments based on role
        if (role === Role.ADMIN) {
          depts.push('marketing', 'properties', 'finance', 'legal', 'offers', 'orders');
        } else if (role === Role.MANGER) {
          deptPerms.marketing = 'manage';
          deptPerms.properties = 'manage';
          deptPerms.employees = true;
          depts.push('marketing', 'properties');
        } else if (role === Role.MARKETING || role === Role.MARKETING_ADMIN) {
          deptPerms.marketing = 'view';
          deptPerms.offers = 'view';
          depts.push('marketing', 'offers');
        } else if (role === Role.LEGAL || role === Role.LEGAL_ADMIN) {
          deptPerms.legal = 'view';
          depts.push('legal');
        } else if (role === Role.FINANCE || role === Role.FINANCE_ADMIN) {
          deptPerms.finance = 'view';
          depts.push('finance');
        }

        user = this.userRepository.create({
          email,
          firstName: role.charAt(0).toUpperCase() + role.slice(1),
          lastName: 'User',
          role: role as Role,
          isActive: true,
          isVerified: true,
          phone,
          departmentPermissions: deptPerms,
          departments: depts as any,
          permissions: role === Role.ADMIN ? seededPermissions : [],
        });
        user = await this.userRepository.save(user);
        this.logger.log(`Seeded user for role: ${role}`);
      }
      if (role === Role.ADMIN) adminUser = user;
    }

    // Seed properties if none exist
    const propertyCount = await this.propertyRepository.count();
    if (propertyCount === 0 && adminUser) {
        const propertiesToSeed: any[] = [];
        
        // 40 Buildings
        for (let i = 0; i < 40; i++) propertiesToSeed.push({ name: `Building ${i+1}`, type: PropertyType.BUILDING, purchasePrice: 5000000 });
        // 25 Compounds
        for (let i = 0; i < 25; i++) propertiesToSeed.push({ name: `Compound ${i+1}`, type: PropertyType.COMPOUND, purchasePrice: 12000000 });
        // 20 Lands
        for (let i = 0; i < 20; i++) propertiesToSeed.push({ name: `Land ${i+1}`, type: PropertyType.LAND, purchasePrice: 3000000 });
        // 15 Warehouses
        for (let i = 0; i < 15; i++) propertiesToSeed.push({ name: `Warehouse ${i+1}`, type: PropertyType.WAREHOUSE, purchasePrice: 2000000 });

        for (const p of propertiesToSeed) {
            const property = this.propertyRepository.create({
                ...p,
                ownerId: adminUser.id,
                deedNumber: `DEED-${Math.floor(Math.random() * 1000000)}`,
                locationUrl: 'https://maps.google.com',
            });
            await this.propertyRepository.save(property);
        }
        this.logger.log('Seeded 100 initial properties with 40/25/20/15 distribution.');
    }

    // Seed financial transactions for charts
    const txCount = await this.transactionRepository.count();
    if (txCount === 0 && adminUser) {
        const today = new Date();
        const transactions: FinancialTransaction[] = [];

        // Seed 12 months of data
        for (let i = 0; i < 12; i++) {
            const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 15);
            // Base amount around 1400 +/- some variation to look like a trend
            const baseAmount = 1450 - (i * 20) + (Math.random() * 50);

            transactions.push(this.transactionRepository.create({
                type: TransactionType.SALE,
                amount: baseAmount,
                status: TransactionStatus.COMPLETED,
                paymentMethod: PaymentMethod.BANK,
                transactionDate: monthDate,
                fromUserId: adminUser.id,
                description: `Mock transaction for month ${monthDate.getMonth() + 1}`,
            }));
        }
        await this.transactionRepository.save(transactions);
        this.logger.log('Seeded 12 months of financial transactions.');
    }

    this.logger.log('Seeding Completed.');
  }
}

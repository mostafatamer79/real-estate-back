import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role, Permission } from '../user/user-entity';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
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

    const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim();
    const adminPhone = process.env.SEED_ADMIN_PHONE?.trim();
    const adminFirstName = process.env.SEED_ADMIN_FIRST_NAME?.trim() || 'Admin';
    const adminLastName = process.env.SEED_ADMIN_LAST_NAME?.trim() || 'User';

    if (!adminEmail && !adminPhone) {
      this.logger.warn(
        'Skipping admin seed. Set SEED_ADMIN_EMAIL or SEED_ADMIN_PHONE in the environment.',
      );
      this.logger.log('Seeding Completed.');
      return;
    }

    const adminDepartments = ['marketing', 'properties', 'finance', 'legal', 'offers', 'orders'];
    const adminDepartmentPermissions = {
      offers: 'manage',
      orders: 'manage',
      marketing: 'manage',
      finance: 'manage',
      properties: 'manage',
      legal: 'manage',
      employees: true,
    };

    let adminUser =
      (adminEmail
        ? await this.userRepository.findOne({ where: { email: adminEmail } })
        : null) ||
      (adminPhone
        ? await this.userRepository.findOne({ where: { phone: adminPhone } })
        : null);

    if (!adminUser) {
      adminUser = this.userRepository.create({
        email: adminEmail,
        phone: adminPhone,
        firstName: adminFirstName,
        lastName: adminLastName,
        role: Role.ADMIN,
        isActive: true,
        isVerified: true,
        departmentPermissions: adminDepartmentPermissions,
        departments: adminDepartments as any,
        permissions: seededPermissions,
      });
      await this.userRepository.save(adminUser);
      this.logger.log(`Seeded admin user: ${adminEmail || adminPhone}`);
    } else {
      adminUser.firstName = adminFirstName;
      adminUser.lastName = adminLastName;
      adminUser.email = adminEmail || adminUser.email;
      adminUser.phone = adminPhone || adminUser.phone;
      adminUser.role = Role.ADMIN;
      adminUser.isActive = true;
      adminUser.isVerified = true;
      adminUser.departmentPermissions = adminDepartmentPermissions;
      adminUser.departments = adminDepartments as any;
      adminUser.permissions = seededPermissions;
      await this.userRepository.save(adminUser);
      this.logger.log(`Updated admin user from env: ${adminEmail || adminPhone}`);
    }

    this.logger.log('Seeding Completed.');
  }
}

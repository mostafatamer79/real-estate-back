import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role, Permission } from '../user/user-entity';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      await this.seed();
    }
  }

  async seed() {
    this.logger.log('Starting Seeding...');

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

    for (const role of roles) {
      const email = `${role}@gmail.com`;
      const phone = `123456789${roles.indexOf(role)}`;
      const existingUser = await this.userRepository.findOne({
        where: [{ email }, { phone }],
      });

      if (!existingUser) {
        // Define department permissions based on role
        const deptPerms = {
          offers: role === Role.ADMIN ? 'manage' : 'view',
          orders: role === Role.ADMIN ? 'manage' : 'view',
          marketing: role === Role.ADMIN ? 'manage' : 'view',
          financial: role === Role.ADMIN ? 'manage' : 'view',
          properties: role === Role.ADMIN ? 'manage' : 'view',
          legal: role === Role.ADMIN ? 'manage' : 'view',
          employees: role === Role.ADMIN,
        };

        const user = this.userRepository.create({
          email,
          firstName: role.charAt(0).toUpperCase() + role.slice(1),
          lastName: 'User',
          role: role as Role,
          isActive: true,
          isVerified: true,
          phone,
          departmentPermissions: deptPerms,
          permissions: role === Role.ADMIN ? seededPermissions : [],
        });
        await this.userRepository.save(user);
        this.logger.log(`Seeded user for role: ${role}`);
      }
    }
    this.logger.log('Seeding Completed.');
  }
}

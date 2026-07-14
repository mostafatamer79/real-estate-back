import { Injectable, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SettingsService } from '../settings/settings.service';
import { Permission, Role, User } from '../user/user-entity';

@Injectable()
export class WipeService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Wipes all platform data while preserving admin user accounts.
   * Keeps reference permissions intact and re-seeds default settings.
   */
  async wipeAllDataExceptAdmins() {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);

      // Ensure at least one admin exists so the platform is not locked out.
      const adminCount = await userRepo.count({ where: { role: Role.ADMIN } });
      if (adminCount === 0) {
        throw new ForbiddenException(
          'No admin user found. Cannot wipe data without preserving an admin account.',
        );
      }

      // Gather every TypeORM-managed table except users and permissions.
      const metadatas = this.dataSource.entityMetadatas;
      const tablesToTruncate = metadatas
        .filter((meta) => meta.tableName !== 'users' && meta.tableName !== 'permissions')
        .map((meta) => `"${meta.tableName}"`);

      // Truncate all non-user, non-permission tables with CASCADE so FK order doesn't matter.
      if (tablesToTruncate.length > 0) {
        await manager.query(`TRUNCATE TABLE ${tablesToTruncate.join(', ')} CASCADE`);
      }

      // Remove every user that is not an admin. Many-to-many join rows cascade automatically.
      await manager.query(`DELETE FROM "users" WHERE "role" != 'admin'`);

      return { adminCount };
    }).then(async ({ adminCount }) => {
      // Re-seed default settings and permissions now that the wipe succeeded.
      await this.settingsService.seedDefaultSettings();
      await this.seedDefaultPermissionsForAdmins();

      return {
        success: true,
        message: `All platform data has been wiped. ${adminCount} admin account(s) preserved.`,
      };
    });
  }

  private async seedDefaultPermissionsForAdmins() {
    const defaultPermissionNames = [
      'user.view',
      'user.manage',
      'property.view',
      'property.manage',
      'order.view',
      'order.manage',
      'marketing.view',
      'marketing.manage',
      'financial.view',
      'financial.manage',
      'legal.view',
      'legal.manage',
    ];

    const permissionRepo = this.dataSource.getRepository(Permission);
    const userRepo = this.dataSource.getRepository(User);

    const seededPermissions: Permission[] = [];
    for (const name of defaultPermissionNames) {
      let permission = await permissionRepo.findOne({ where: { name } });
      if (!permission) {
        permission = permissionRepo.create({ name });
        permission = await permissionRepo.save(permission);
      }
      seededPermissions.push(permission);
    }

    const admins = await userRepo.find({ where: { role: Role.ADMIN } });
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

    for (const admin of admins) {
      admin.permissions = seededPermissions;
      admin.departments = adminDepartments as any;
      admin.departmentPermissions = adminDepartmentPermissions;
      await userRepo.save(admin);
    }
  }
}

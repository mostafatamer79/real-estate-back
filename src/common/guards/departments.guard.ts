import { CanActivate, ExecutionContext, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DEPARTMENTS_KEY } from '../decorators/departments.decorators';
import { SKIP_DEPARTMENTS_GUARD_KEY } from '../decorators/skip-departments.decorator';
import { Role } from '../../user/user-entity';
import { SettingsService } from '../../settings/settings.service';

@Injectable()
export class DepartmentsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly settingsService: SettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const shouldSkip = this.reflector.getAllAndOverride<boolean>(SKIP_DEPARTMENTS_GUARD_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (shouldSkip) return true;

    const requiredDepartments = this.reflector.getAllAndOverride<string[]>(DEPARTMENTS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredDepartments || requiredDepartments.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      return true;
    }

    // Admin has access to all departments.
    if (user.role === Role.ADMIN) return true;

    // Module availability enforcement (backend-side).
    // If a module is disabled, treat it as not found. If it's "soon", forbid access.
    for (const department of requiredDepartments) {
      const flag = await this.settingsService.findOne(`module_${department}`);
      const status = flag?.value || 'enabled';
      if (status === 'disabled') {
        throw new NotFoundException('Resource not found');
      }
      if (status === 'soon') {
        const msg = await this.settingsService.findOne(`module_${department}_message`);
        throw new ForbiddenException(msg?.value || 'Coming soon');
      }
    }

    const userDepartments = Array.isArray(user.departments) ? user.departments : [];
    const departmentPermissions = user.departmentPermissions || {};

    const hasAccess = requiredDepartments.some((department) =>
      userDepartments.includes(department) ||
      departmentPermissions[department] === true ||
      departmentPermissions[department] === 'manage' ||
      departmentPermissions[department] === 'view'
    );

    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}

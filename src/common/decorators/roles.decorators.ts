import { SetMetadata } from '@nestjs/common';
import { Role } from '../../user/user-entity';

export const ROLES_KEY = 'roles_metadata';
export const Roles = (roles: Role[]) => SetMetadata(ROLES_KEY, roles);

import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission_key';
export const Permission = (permission: string) => SetMetadata(PERMISSION_KEY, permission);


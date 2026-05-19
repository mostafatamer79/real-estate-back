import { SetMetadata } from '@nestjs/common';

export const DEPARTMENTS_KEY = 'departments_metadata';
export const Departments = (...departments: string[]) => SetMetadata(DEPARTMENTS_KEY, departments);

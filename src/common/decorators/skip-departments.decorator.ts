import { SetMetadata } from '@nestjs/common';

export const SKIP_DEPARTMENTS_GUARD_KEY = 'skip_departments_guard';

export const SkipDepartmentsGuard = () => SetMetadata(SKIP_DEPARTMENTS_GUARD_KEY, true);


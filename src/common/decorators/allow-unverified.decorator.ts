import { SetMetadata } from '@nestjs/common';

export const ALLOW_UNVERIFIED_KEY = 'allowUnverified';
// Only auth and account maintenance may opt out of identity requirements.
export const AllowUnverified = () => SetMetadata(ALLOW_UNVERIFIED_KEY, true);

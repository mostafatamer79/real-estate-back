import { SetMetadata } from '@nestjs/common';

export const SKIP_SUBSCRIPTION_GUARD_KEY = 'skip_subscription_guard';

/**
 * Apply this to controllers or handlers that should bypass the
 * SubscriptionGuard (e.g. public routes, auth endpoints, subscription CRUD itself).
 */
export const SkipSubscriptionGuard = () =>
  SetMetadata(SKIP_SUBSCRIPTION_GUARD_KEY, true);

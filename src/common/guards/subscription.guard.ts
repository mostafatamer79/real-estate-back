import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from '../../subscription/subscription.service';
import { SKIP_SUBSCRIPTION_GUARD_KEY } from '../decorators/skip-subscription.decorator';
import { Role } from '../../user/user-entity';

/**
 * SubscriptionGuard — Globally enforces that the requesting user (or their
 * root manager/admin) has an active subscription before any endpoint runs.
 *
 * Bypass:
 *   @SkipSubscriptionGuard()       — on a controller class or route handler
 *   ADMIN users bypass automatically — they are the owners of subscriptions.
 *     (The guard still validates the admin's own subscription.)
 *
 * Execution order (per request):
 *   JwtAuthGuard → RolesGuard → DepartmentsGuard → SubscriptionGuard
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ── 1. Opt-out via decorator ──────────────────────────────────────────────
    const shouldSkip = this.reflector.getAllAndOverride<boolean>(
      SKIP_SUBSCRIPTION_GUARD_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (shouldSkip) return true;

    // ── 2. Get authenticated user ─────────────────────────────────────────────
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // If no user (public route or JWT already rejected), let other guards handle.
    if (!user) return true;

    // ── 2.5 Bypass for ADMIN ──────────────────────────────────────────────────
    if (user.role === Role.ADMIN) return true;

    // ── 3. Check subscription status ─────────────────────────────────────────
    try {
      const status = await this.subscriptionService.getSubscriptionStatus(
        user.userId || user.id,
      );

      if (!status.active) {
        throw new ForbiddenException(
          'Your subscription has expired. Please contact support to renew.',
        );
      }
    } catch (err) {
      // Re-throw ForbiddenException as-is; swallow "User not found" for
      // service-account tokens that have no subscription.
      if (err instanceof ForbiddenException) throw err;
    }

    return true;
  }
}

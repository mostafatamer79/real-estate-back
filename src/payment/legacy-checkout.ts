import { BadRequestException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { isUUID } from 'class-validator';

export type LegacyCheckoutTarget = { invoiceId?: string; bookingId?: string; subscriptionId?: string };

export function checkoutHandoff(params: LegacyCheckoutTarget, user: { id?: string } | undefined, returnUrl?: string) {
  if (!user?.id) throw new UnauthorizedException('Authentication required');
  const targets = Object.entries({ invoiceId: params.invoiceId, bookingId: params.bookingId, subscriptionId: params.subscriptionId })
    .filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (targets.length !== 1 || typeof targets[0][1] !== 'string' || !isUUID(targets[0][1])) {
    throw new BadRequestException('Provide exactly one valid payment target');
  }
  let checkout: URL;
  try {
    const configured = new URL(returnUrl || '');
    if (configured.protocol !== 'https:' || configured.username || configured.password) throw new Error();
    checkout = new URL('/checkout', configured);
  } catch {
    throw new ServiceUnavailableException('Secure checkout URL is not configured');
  }
  checkout.searchParams.set(targets[0][0], targets[0][1]);
  // This URL carries only the target. The Geidea endpoint still checks ownership,
  // retrieves the stored amount, and independently verifies settlement.
  return { paymentUrl: checkout.toString(), provider: 'geidea' as const };
}

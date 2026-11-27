import { BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Invoice, InvoiceStatus } from '../financial/entities/invoice.entity';
import {
  EmailMarketing,
  EmailMarketingApprovalStatus,
} from './entities/email-marketing.entity';

export const EMAIL_MARKETING_INVOICE_REFERENCE_TYPE = 'EmailMarketing';

/**
 * Validates and optionally locks the canonical EmailMarketing campaign linked to an invoice.
 * Must be called AFTER locking the Invoice row (invoice -> campaign lock order)
 * and BEFORE debiting the wallet or settling a gateway payment.
 */
export async function preparePaidAdCampaign(
  manager: EntityManager,
  invoice: Invoice,
  lock = true,
): Promise<EmailMarketing | null> {
  if (invoice.referenceType !== EMAIL_MARKETING_INVOICE_REFERENCE_TYPE) {
    return null;
  }
  if (!invoice.referenceId) {
    throw new BadRequestException('Invalid ad invoice reference');
  }

  const campaign = await manager.findOne(EmailMarketing, {
    where: { id: invoice.referenceId },
    ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
  });

  if (!campaign) {
    throw new BadRequestException('Ad campaign not found for invoice');
  }
  if (campaign.invoiceId !== invoice.id) {
    throw new BadRequestException('Stale or superseded ad invoice');
  }
  if (!campaign.ownerId || campaign.ownerId !== invoice.userId) {
    throw new BadRequestException('Ad invoice owner mismatch');
  }
  if (invoice.status !== InvoiceStatus.UNPAID) {
    throw new BadRequestException('Ad invoice is no longer payable');
  }
  if (campaign.approvalStatus !== EmailMarketingApprovalStatus.AWAITING_PAYMENT) {
    throw new BadRequestException('Ad campaign is not awaiting payment');
  }

  const fee = Number(campaign.publicationFee);
  const invoiceTotal = Number(invoice.total);
  if (
    !Number.isFinite(fee) ||
    fee <= 0 ||
    !Number.isFinite(invoiceTotal) ||
    invoiceTotal <= 0 ||
    Math.round(invoiceTotal * 100) !== Math.round(fee * 100)
  ) {
    throw new BadRequestException('Invoice total does not match approved ad publication fee');
  }

  return campaign;
}

/**
 * Atomically marks a verified, paid ad campaign as published and active.
 * Call only inside the same transaction that transitions Invoice.status to PAID.
 */
export async function publishPaidAd(
  manager: EntityManager,
  invoice: Invoice,
  lockedCampaign?: EmailMarketing | null,
): Promise<EmailMarketing | null> {
  if (invoice.referenceType !== EMAIL_MARKETING_INVOICE_REFERENCE_TYPE) {
    return null;
  }

  const campaign = lockedCampaign ?? (await preparePaidAdCampaign(manager, invoice, true));
  if (!campaign) {
    return null;
  }

  campaign.approvalStatus = EmailMarketingApprovalStatus.PUBLISHED;
  campaign.isActive = true;
  return manager.save(EmailMarketing, campaign);
}

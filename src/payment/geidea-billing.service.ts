import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Invoice, InvoiceStatus } from '../financial/entities/invoice.entity';
import { FinancialTransaction, PaymentMethod, TransactionStatus, TransactionType } from '../financial/entities/financial-transaction.entity';
import { Subscription, SubscriptionStatus, PaymentMethod as SubscriptionPaymentMethod } from '../subscription/subscription.entity';
import { SubscriptionService } from '../subscription/subscription.service';
import { User } from '../user/user-entity';

export const GEIDEA_TOPUP = 'GeideaWalletTopup';
export const GEIDEA_SUBSCRIPTION = 'GeideaSubscription';

@Injectable()
export class GeideaBillingService {
  constructor(private readonly subscriptions: SubscriptionService) {}

  async prepare(params: { subscriptionId?: string; walletTopupAmount?: number }, user: { id: string }, manager: EntityManager): Promise<Invoice> {
    if (params.subscriptionId) {
      const subscription = await manager.findOne(Subscription, {
        where: { id: params.subscriptionId }, lock: { mode: 'pessimistic_write' },
      });
      if (!subscription) throw new NotFoundException('Subscription not found');
      if (subscription.userId !== user.id) throw new ForbiddenException('You do not have permission to pay this subscription');
      if (subscription.status !== SubscriptionStatus.PENDING) throw new BadRequestException('Subscription is not payable');
      const total = Number(subscription.amount);
      if (!Number.isFinite(total) || total <= 0) throw new BadRequestException('Invalid subscription amount');
      const existing = await manager.findOne(Invoice, {
        where: { referenceType: GEIDEA_SUBSCRIPTION, referenceId: subscription.id, userId: user.id, status: InvoiceStatus.UNPAID },
      });
      if (existing) {
        if (Number(existing.total) !== total) throw new BadRequestException('Subscription amount changed; contact support');
        return existing;
      }
      return manager.save(Invoice, {
        userId: user.id, amount: total, total, tax: 0, serviceFee: 0,
        referenceType: GEIDEA_SUBSCRIPTION, referenceId: subscription.id,
        status: InvoiceStatus.UNPAID, description: 'دفع الاشتراك عبر جيديا',
      });
    }
    const amount = params.walletTopupAmount;
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 1 || amount > 10000
      || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) {
      throw new BadRequestException('Invalid top-up amount; use 1–10000 SAR with at most two decimal places');
    }
    return manager.save(Invoice, {
      userId: user.id, amount, total: amount, tax: 0, serviceFee: 0,
      referenceType: GEIDEA_TOPUP, referenceId: user.id,
      status: InvoiceStatus.UNPAID, description: 'شحن المحفظة عبر جيديا',
    });
  }

  async fulfillInvoice(invoice: Invoice, orderId: string, manager: EntityManager): Promise<void> {
    if (invoice.referenceType === GEIDEA_TOPUP) {
      const owner = await manager.findOne(User, { where: { id: invoice.userId }, lock: { mode: 'pessimistic_write' } });
      if (!owner || invoice.referenceId !== invoice.userId) throw new BadRequestException('Invalid top-up owner');
      await manager.save(FinancialTransaction, {
        type: TransactionType.DEPOSIT, amount: invoice.total, toUserId: invoice.userId,
        status: TransactionStatus.COMPLETED, paymentMethod: PaymentMethod.CARD,
        referenceType: 'geidea_wallet_topup', referenceId: invoice.id,
        description: 'شحن المحفظة عبر جيديا', commissionBreakdown: { geideaOrderId: orderId },
      });
      return;
    }
    if (invoice.referenceType === GEIDEA_SUBSCRIPTION) {
      const subscription = await manager.findOne(Subscription, {
        where: { id: invoice.referenceId }, lock: { mode: 'pessimistic_write' },
      });
      if (!subscription || subscription.userId !== invoice.userId) throw new BadRequestException('Invalid subscription owner');
      if (Number(subscription.amount) !== Number(invoice.total)) throw new BadRequestException('Subscription amount does not match');
      if (subscription.status !== SubscriptionStatus.PENDING) throw new BadRequestException('Subscription is no longer payable');
      await this.subscriptions.activateVerifiedPayment(subscription.id, invoice.userId, orderId, SubscriptionPaymentMethod.CREDIT_CARD, manager);
    }
    await this.recordPayment(invoice.id, invoice.userId, Number(invoice.total), orderId, manager);
  }

  async recordPayment(referenceId: string, userId: string, amount: number, orderId: string, manager: EntityManager): Promise<void> {
    await manager.save(FinancialTransaction, {
      type: TransactionType.EXPENSE, amount, fromUserId: userId, status: TransactionStatus.COMPLETED,
      paymentMethod: PaymentMethod.CARD, referenceType: 'geidea_payment', referenceId,
      description: 'دفعة إلكترونية عبر جيديا', commissionBreakdown: { geideaOrderId: orderId },
    });
  }
}

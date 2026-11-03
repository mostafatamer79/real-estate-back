import { EntityManager } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { GeideaBillingService } from './geidea-billing.service';
import { Invoice, InvoiceStatus } from '../financial/entities/invoice.entity';
import { FinancialTransaction, TransactionStatus } from '../financial/entities/financial-transaction.entity';
import { Subscription, SubscriptionStatus, SubscriptionType } from '../subscription/subscription.entity';
import { SubscriptionService } from '../subscription/subscription.service';
import { User } from '../user/user-entity';

describe('Geidea billing fulfillment', () => {
  const userId = '84601e93-08c7-43f9-a1d0-9fe6445df767';
  const subscriptionId = '42bd90c3-0a0e-4912-b5c3-2c50407aeeb6';
  let rows: Map<unknown, Array<Record<string, any>>>;
  let manager: EntityManager;
  let billing: GeideaBillingService;
  beforeEach(() => {
    rows = new Map([[User, [{ id: userId, departments: [], departmentPermissions: {} }]], [Invoice, []],
      [Subscription, [{ id: subscriptionId, userId, amount: 200, status: SubscriptionStatus.PENDING,
        subscriptionType: SubscriptionType.MONTHLY, selectedDepartments: ['legal'],
        startDate: '2026-01-01', endDate: '2026-02-01' }]], [FinancialTransaction, []]]);
    manager = {
      findOne: async (entity, options) => {
        const found = (rows.get(entity) || []).find(row => Object.entries(options.where).every(([key, value]) => row[key] === value));
        return found ? structuredClone(found) : null;
      },
      save: async (entity, input) => {
        const value = { ...input, id: input.id || randomUUID() };
        const table = rows.get(entity) || [];
        const index = table.findIndex(row => row.id === value.id);
        if (index < 0) table.push(structuredClone(value)); else table[index] = structuredClone(value);
        rows.set(entity, table);
        return value;
      },
    } as unknown as EntityManager;
    const subscriptions = new SubscriptionService({} as never, {} as never, {} as never, {} as never, {} as never, {} as never);
    billing = new GeideaBillingService(subscriptions);
  });

  it('persists an unpaid top-up invoice before checkout without increasing the balance', async () => {
    const invoice = await billing.prepare({ walletTopupAmount: 50.25 }, { id: userId }, manager);
    expect(invoice.total).toBe(50.25);
    expect(invoice.userId).toBe(userId);
    expect(invoice.status).toBe(InvoiceStatus.UNPAID);
    expect(invoice.referenceType).toBe('GeideaWalletTopup');
    expect(rows.get(FinancialTransaction)).toHaveLength(0);
  });

  it.each([0, -1, 0.001, 10001, NaN, Infinity])('rejects invalid top-up amount %s before creating a record', async amount => {
    await expect(billing.prepare({ walletTopupAmount: amount }, { id: userId }, manager)).rejects.toThrow('amount');
    expect(rows.get(Invoice)).toHaveLength(0);
  });

  it('creates a completed deposit for a verified top-up', async () => {
    const invoice = await billing.prepare({ walletTopupAmount: 75 }, { id: userId }, manager);
    await billing.fulfillInvoice(invoice, 'gateway-order', manager);
    const deposits = rows.get(FinancialTransaction)!;
    expect(deposits).toHaveLength(1);
    expect(deposits[0]).toMatchObject({ amount: 75, toUserId: userId, status: TransactionStatus.COMPLETED, type: 'deposit' });
  });

  it('uses the stored subscription price and reuses its pending invoice', async () => {
    const first = await billing.prepare({ subscriptionId }, { id: userId }, manager);
    const second = await billing.prepare({ subscriptionId }, { id: userId }, manager);
    expect(first.total).toBe(200);
    expect(second.id).toBe(first.id);
    expect(rows.get(Invoice)).toHaveLength(1);
  });

  it('rejects payment for another customer’s subscription', async () => {
    await expect(billing.prepare({ subscriptionId }, { id: randomUUID() }, manager)).rejects.toThrow('permission');
    expect(rows.get(Invoice)).toHaveLength(0);
  });

  it('activates a paid subscription and grants its departments in the transaction', async () => {
    const invoice = await billing.prepare({ subscriptionId }, { id: userId }, manager);
    await billing.fulfillInvoice(invoice, 'gateway-order', manager);
    expect(rows.get(Subscription)![0]).toMatchObject({ status: SubscriptionStatus.ACTIVE, paymentReference: 'geidea:gateway-order' });
    expect(Number.isFinite(new Date(rows.get(Subscription)![0].paidAt).getTime())).toBe(true);
    expect(rows.get(User)![0].departments).toEqual(['legal']);
    expect(rows.get(User)![0].departmentPermissions.legal).toBe(true);
    expect(rows.get(FinancialTransaction)![0]).toMatchObject({ referenceType: 'geidea_payment', fromUserId: userId, amount: 200 });
  });

  it('rejects settlement if the stored subscription price changed', async () => {
    const invoice = await billing.prepare({ subscriptionId }, { id: userId }, manager);
    rows.get(Subscription)![0].amount = 300;
    await expect(billing.fulfillInvoice(invoice, 'gateway-order', manager)).rejects.toThrow('amount');
    expect(rows.get(Subscription)![0].status).toBe(SubscriptionStatus.PENDING);
    expect(rows.get(FinancialTransaction)).toHaveLength(0);
  });
});

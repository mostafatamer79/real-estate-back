import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { GeideaService } from './geidea.service';
import { GeideaBillingService } from './geidea-billing.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { FinancialTransaction } from '../financial/entities/financial-transaction.entity';
import { Invoice, InvoiceStatus } from '../financial/entities/invoice.entity';
import { Booking, BookingStatus } from '../booking/entities/booking.entity';
import { ServiceRequest, PaidStatus } from '../service/service-request.entity';

const itemId = '3b834bd0-dc9d-4e58-9936-67d845b6015e';
// Geidea's documented GUIDs can use a non-RFC UUID variant (for example "cdec").
const orderId = '0b02b503-fbf8-49dd-cdec-08dcdb056790';
const user = { id: 'customer-1', email: 'customer@example.test' };

describe('Geidea checkout', () => {
  let service: GeideaService;
  let invoice: Partial<Invoice>;
  let booking: Partial<Booking> | null;
  let serviceRequest: Partial<ServiceRequest> | null;
  let requests: Array<{ url: string; init?: RequestInit }>;
  let gateway: Record<string, unknown>;
  let settings: Record<string, string>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    invoice = { id: itemId, userId: user.id, total: 115, status: InvoiceStatus.UNPAID };
    booking = null;
    serviceRequest = null;
    settings = {
      GEIDEA_ENABLED: 'true', GEIDEA_MERCHANT_PUBLIC_KEY: 'test-public-key',
      GEIDEA_API_PASSWORD: 'test-api-password',
      GEIDEA_CALLBACK_URL: 'https://api.example.test/api/payment/geidea/callback',
      GEIDEA_RETURN_URL: 'https://example.test/wallet',
    };
    gateway = {
      responseCode: '000', detailedResponseCode: '000',
      order: { orderId, merchantReferenceId: itemId, merchantPublicKey: 'test-public-key',
        amount: 115, currency: 'SAR', status: 'Success', detailedStatus: 'Paid', isTest: true },
    };
    requests = [];
    global.fetch = (async (url, init) => {
      requests.push({ url: String(url), init });
      const body = String(url).includes('/session')
        ? { responseCode: '000', session: { id: orderId } } : gateway;
      return new Response(JSON.stringify(body), { status: 200 });
    }) as typeof fetch;
    // The database is external; retain real service rules and a stateful persistence boundary.
    const manager = {
      findOne: async (entity: unknown) => entity === Invoice ? invoice : entity === ServiceRequest ? serviceRequest : booking,
      save: async (entity: unknown, value: Partial<Invoice> | Partial<ServiceRequest>) => {
        if (entity === ServiceRequest) serviceRequest = value as Partial<ServiceRequest>;
        else if (entity !== FinancialTransaction) invoice = value as Partial<Invoice>;
        return value;
      },
    } as unknown as EntityManager;
    const dataSource = { manager, transaction: async (run: (em: EntityManager) => Promise<unknown>) => run(manager) } as DataSource;
    service = new GeideaService(
      new ConfigService(settings), dataSource,
      { findOne: async () => invoice } as never,
      { findOne: async () => booking } as never,
      new GeideaBillingService(new SubscriptionService({} as never, {} as never, {} as never, {} as never, {} as never, {} as never)),
    );
  });

  afterEach(() => { global.fetch = originalFetch; });

  it('creates a signed SAR session using the stored invoice total', async () => {
    const date = jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-10-15T12:00:00.000Z');
    const result = await service.createSession({ invoiceId: itemId, language: 'ar' }, user);
    date.mockRestore();
    const body = JSON.parse(String(requests[0].init?.body));
    expect(body.amount).toBe(115);
    expect(body.currency).toBe('SAR');
    expect(body.merchantReferenceId).toBe(itemId);
    expect(body.signature).toBe('33Z8IVstWd9hxU8wWkmdYXfxP5u7sbXPkZW+zvCQS7k=');
    expect(body.language).toBe('ar');
    expect(requests[0].url).toBe('https://api.ksamerchant.geidea.net/payment-intent/api/v2/direct/session');
    expect(result.sessionId).toBe(orderId);
    expect(JSON.stringify(result)).not.toContain('test-api-password');
  });

  it('requires authentication even if the global free trial bypasses the JWT guard', async () => {
    await expect(service.createSession({ invoiceId: itemId }, undefined)).rejects.toThrow('Authentication required');
    expect(requests).toHaveLength(0);
  });

  it('rejects another customer’s invoice', async () => {
    invoice.userId = 'someone-else';
    await expect(service.createSession({ invoiceId: itemId }, user)).rejects.toThrow('permission');
    expect(requests).toHaveLength(0);
  });

  it('rejects another customer’s booking', async () => {
    booking = { id: itemId, userId: 'someone-else', price: 115, status: BookingStatus.ACCEPTED };
    await expect(service.createSession({ bookingId: itemId }, user)).rejects.toThrow('permission');
  });

  it.each([0, -1, NaN, Infinity])('rejects invalid stored amount %s', async (total) => {
    invoice.total = total;
    await expect(service.createSession({ invoiceId: itemId }, user)).rejects.toThrow('amount');
    expect(requests).toHaveLength(0);
  });

  it('rejects ambiguous or missing payment targets', async () => {
    await expect(service.createSession({ invoiceId: itemId, bookingId: itemId }, user)).rejects.toThrow('exactly one');
    await expect(service.createSession({}, user)).rejects.toThrow('exactly one');
  });

  it('requires explicit activation and HTTPS callback configuration', async () => {
    settings.GEIDEA_ENABLED = 'false';
    await expect(service.createSession({ invoiceId: itemId }, user)).rejects.toThrow('not enabled');
    settings.GEIDEA_ENABLED = 'true';
    settings.GEIDEA_CALLBACK_URL = 'http://localhost/callback';
    await expect(service.createSession({ invoiceId: itemId }, user)).rejects.toThrow('HTTPS');
  });

  it('settles only an independently fetched, matching paid order and tolerates duplicate callbacks', async () => {
    await expect(service.verifyOrder(orderId)).resolves.toEqual({ paid: true });
    expect(invoice.status).toBe(InvoiceStatus.PAID);
    await expect(service.verifyOrder(orderId)).resolves.toEqual({ paid: true });
    expect(requests[0].url).toContain('/pgw/api/v1/direct/order/' + orderId);
  });

  it.each([
    { amount: 1 }, { currency: 'USD' }, { merchantReferenceId: orderId },
    { merchantPublicKey: 'other-merchant' }, { orderId: itemId }, { isTest: false },
  ])('rejects an order with mismatched payment data: %j', async (changes) => {
    gateway.order = { ...(gateway.order as object), ...changes };
    await expect(service.verifyOrder(orderId)).rejects.toThrow();
    expect(invoice.status).toBe(InvoiceStatus.UNPAID);
  });

  it.each(['Failed', 'Cancelled', 'InProgress'])('does not settle a %s order', async (status) => {
    gateway.order = { ...(gateway.order as object), status, detailedStatus: status };
    await expect(service.verifyOrder(orderId)).resolves.toEqual({ paid: false, status: status === 'InProgress' ? 'pending' : status.toLowerCase() });
    expect(invoice.status).toBe(InvoiceStatus.UNPAID);
  });

  it('does not resurrect a cancelled invoice', async () => {
    invoice.status = InvoiceStatus.CANCELLED;
    await expect(service.verifyOrder(orderId)).rejects.toThrow('payable');
    expect(invoice.status).toBe(InvoiceStatus.CANCELLED);
  });

  it('fulfills the linked legal service in the same paid transition', async () => {
    invoice.referenceType = 'ServiceRequest';
    invoice.referenceId = itemId;
    serviceRequest = { id: itemId, userId: user.id, price: 115, category: 'legal', paymentStatus: PaidStatus.UNPAID, adminAccepted: false };
    await service.verifyOrder(orderId);
    expect(invoice.status).toBe(InvoiceStatus.PAID);
    expect(serviceRequest.paymentStatus).toBe(PaidStatus.PAID);
    expect(serviceRequest.adminAccepted).toBe(true);
  });

  it.each([{ userId: 'another-user', price: 115 }, { userId: user.id, price: 500 }])('rejects a service invoice with mismatched owner or price: %j', async request => {
    invoice.referenceType = 'ServiceRequest';
    invoice.referenceId = itemId;
    serviceRequest = { id: itemId, ...request, paymentStatus: PaidStatus.UNPAID };
    await expect(service.verifyOrder(orderId)).rejects.toThrow('service request');
    expect(invoice.status).toBe(InvoiceStatus.UNPAID);
    expect(serviceRequest.paymentStatus).toBe(PaidStatus.UNPAID);
  });

  it('does not expose gateway errors or credentials', async () => {
    global.fetch = (async () => new Response(JSON.stringify({ message: 'test-api-password' }), { status: 401 })) as typeof fetch;
    await expect(service.createSession({ invoiceId: itemId }, user)).rejects.toThrow('Geidea request failed');
  });

  it('checks order ownership before an authenticated browser verification can settle it', async () => {
    invoice.userId = 'someone-else';
    await expect(service.verifyOrder(orderId, user)).rejects.toThrow('permission');
    expect(invoice.status).toBe(InvoiceStatus.UNPAID);
  });
});

import {
  BadGatewayException, BadRequestException, ForbiddenException, Injectable,
  NotFoundException, ServiceUnavailableException, UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac } from 'node:crypto';
import { isUUID } from 'class-validator';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../financial/entities/invoice.entity';
import { Booking, BookingStatus } from '../booking/entities/booking.entity';
import { ServiceRequest, PaidStatus } from '../service/service-request.entity';
import { CreateGeideaSessionDto, GEIDEA_GUID } from './geidea.dto';
import { GeideaBillingService } from './geidea-billing.service';
import { invoiceServiceRequest } from '../financial/invoice-service-request';

type PaymentUser = { id: string; email?: string };
type GeideaOrder = {
  orderId: string;
  merchantReferenceId: string;
  merchantPublicKey: string;
  amount: number;
  currency: string;
  status: string;
  detailedStatus: string;
  isTest: boolean;
};
type GatewayResponse = {
  responseCode?: string;
  detailedResponseCode?: string;
  session?: { id: string };
  order?: GeideaOrder;
};

const REGIONS = {
  KSA: { api: 'https://api.ksamerchant.geidea.net', checkout: 'https://www.ksamerchant.geidea.net' },
  EGY: { api: 'https://api.merchant.geidea.net', checkout: 'https://www.merchant.geidea.net' },
  UAE: { api: 'https://api.geidea.ae', checkout: 'https://payments.geidea.ae' },
};

@Injectable()
export class GeideaService {
  constructor(
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(Invoice) private readonly invoices: Repository<Invoice>,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    private readonly billing: GeideaBillingService,
  ) {}

  private region() {
    const region = this.config.get<string>('GEIDEA_REGION') || 'KSA';
    if (!(region in REGIONS)) throw new ServiceUnavailableException('Invalid GEIDEA_REGION');
    return REGIONS[region as keyof typeof REGIONS];
  }

  private credentials() {
    const publicKey = this.config.get<string>('GEIDEA_MERCHANT_PUBLIC_KEY');
    const password = this.config.get<string>('GEIDEA_API_PASSWORD');
    if (!publicKey || !password) throw new ServiceUnavailableException('Geidea API credentials are not configured');
    return { publicKey, password };
  }

  private httpsUrl(key: string) {
    const value = this.config.get<string>(key);
    try {
      const url = new URL(value || '');
      if (url.protocol === 'https:' && !url.username && !url.password) return url.toString();
    } catch { /* Report a configuration error without exposing its value. */ }
    throw new ServiceUnavailableException(`${key} must be an HTTPS URL`);
  }

  private authenticate(user?: PaymentUser): PaymentUser {
    if (!user?.id) throw new UnauthorizedException('Authentication required');
    return user;
  }

  private checkOwner(item: Invoice | Booking, user: PaymentUser) {
    if (item.userId !== user.id) throw new ForbiddenException('You do not have permission to pay this item');
  }

  private amount(value: number | string) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Invalid payment amount');
    return Number(amount.toFixed(2));
  }

  private async request(path: string, body?: unknown): Promise<GatewayResponse> {
    const { publicKey, password } = this.credentials();
    try {
      const response = await fetch(this.region().api + path, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json', Accept: 'application/json',
          Authorization: 'Basic ' + Buffer.from(`${publicKey}:${password}`).toString('base64'),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
        redirect: 'error',
      });
      if (!response.ok) throw new Error('Gateway HTTP error');
      const result = await response.json() as GatewayResponse;
      if (result.responseCode !== '000') throw new Error('Gateway rejected request');
      return result;
    } catch {
      // Never expose upstream response bodies, Authorization headers, or fetch errors.
      throw new BadGatewayException('Geidea request failed; please try again later');
    }
  }

  async createSession(params: CreateGeideaSessionDto, currentUser?: PaymentUser) {
    const user = this.authenticate(currentUser);
    if (this.config.get<string>('GEIDEA_ENABLED') !== 'true') {
      throw new ServiceUnavailableException('Geidea checkout is not enabled');
    }
    const targetCount = [params.bookingId, params.invoiceId, params.subscriptionId, params.walletTopupAmount]
      .filter(value => value !== undefined && value !== null && value !== '').length;
    if (targetCount !== 1) {
      throw new BadRequestException('Provide exactly one payment target');
    }
    if (params.subscriptionId && !isUUID(params.subscriptionId)) throw new BadRequestException('Invalid subscription ID');
    const prepared = params.subscriptionId || params.walletTopupAmount !== undefined
      ? await this.dataSource.transaction(manager => this.billing.prepare(params, user, manager)) : null;
    const invoiceId = prepared?.id || params.invoiceId;
    const id = invoiceId || params.bookingId!;
    if (!isUUID(id)) throw new BadRequestException('Invalid payment item ID');
    const item = invoiceId
      ? prepared || await this.invoices.findOne({ where: { id } })
      : await this.bookings.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Payment item not found');
    this.checkOwner(item, user);
    const payable = invoiceId
      ? item.status === InvoiceStatus.UNPAID
      : [BookingStatus.PENDING, BookingStatus.ACCEPTED].includes(item.status as BookingStatus);
    if (!payable) throw new BadRequestException('Item is not payable');
    if (invoiceId) await invoiceServiceRequest(this.dataSource.manager, item as Invoice, false);
    const amount = this.amount(invoiceId ? (item as Invoice).total : (item as Booking).price);
    const { publicKey, password } = this.credentials();
    const timestamp = new Date().toISOString();
    const currency = 'SAR';
    const signature = createHmac('sha256', password)
      .update(`${publicKey}${amount.toFixed(2)}${currency}${id}${timestamp}`).digest('base64');
    const result = await this.request('/payment-intent/api/v2/direct/session', {
      amount, currency, timestamp, merchantReferenceId: id, signature,
      paymentOperation: 'Pay', language: params.language || 'ar',
      callbackUrl: this.httpsUrl('GEIDEA_CALLBACK_URL'),
      returnUrl: this.httpsUrl('GEIDEA_RETURN_URL'),
      customer: { email: user.email },
    });
    if (!result.session?.id || !GEIDEA_GUID.test(result.session.id)) {
      throw new BadGatewayException('Geidea did not return a checkout session');
    }
    return { sessionId: result.session.id, scriptUrl: this.region().checkout + '/hpp/geideaCheckout.min.js' };
  }

  async verifyOrder(orderId: string, user?: PaymentUser): Promise<{ paid: boolean; status?: 'pending' | 'failed' | 'cancelled' }> {
    if (typeof orderId !== 'string' || !GEIDEA_GUID.test(orderId)) throw new BadRequestException('Invalid Geidea order ID');
    // Re-fetch from Geidea using server credentials. Browser and webhook payloads
    // are untrusted hints; neither supplies the amount, reference, or paid status.
    const result = await this.request('/pgw/api/v1/direct/order/' + orderId);
    const order = result.order;
    if (!order || order.orderId !== orderId || !isUUID(order.merchantReferenceId)
      || order.merchantPublicKey !== this.credentials().publicKey || order.currency !== 'SAR') {
      throw new BadRequestException('Geidea order does not match this merchant');
    }
    const mode = this.config.get<string>('GEIDEA_MODE') || 'test';
    if (!['test', 'live'].includes(mode) || order.isTest !== (mode === 'test')) {
      throw new BadRequestException('Geidea order does not match the configured test/live mode');
    }
    return this.dataSource.transaction(async (manager) => this.settle(manager, order, user));
  }

  private async settle(manager: EntityManager, order: GeideaOrder, user?: PaymentUser): Promise<{ paid: boolean; status?: 'pending' | 'failed' | 'cancelled' }> {
    const id = order.merchantReferenceId;
    const invoice = await manager.findOne(Invoice, { where: { id }, lock: { mode: 'pessimistic_write' } });
    const booking = invoice ? null : await manager.findOne(Booking, { where: { id }, lock: { mode: 'pessimistic_write' } });
    const item = invoice || booking;
    if (!item || item.id !== id) throw new NotFoundException('Payment item not found');
    if (user) this.checkOwner(item, user);
    const expected = this.amount(invoice ? invoice.total : booking!.price);
    if (this.amount(order.amount) !== expected) throw new BadRequestException('Geidea payment amount does not match');
    if (order.status !== 'Success' || order.detailedStatus !== 'Paid') {
      const status = order.status === 'Failed' ? 'failed' : order.status === 'Cancelled' ? 'cancelled' : 'pending';
      return { paid: false, status };
    }
    if (invoice ? invoice.status === InvoiceStatus.PAID : booking!.status === BookingStatus.PAID) return { paid: true };
    const payable = invoice ? invoice.status === InvoiceStatus.UNPAID
      : [BookingStatus.PENDING, BookingStatus.ACCEPTED].includes(booking!.status);
    if (!payable) throw new BadRequestException('Item is no longer payable');
    // A row lock makes duplicate or concurrent notifications idempotent.
    if (invoice) {
      const request = await invoiceServiceRequest(manager, invoice);
      await this.billing.fulfillInvoice(invoice, order.orderId, manager);
      if (request) {
          request.paymentStatus = PaidStatus.PAID;
          if (['construction', 'legal'].includes(request.category || 'other')) request.adminAccepted = true;
          await manager.save(ServiceRequest, request);
      }
      invoice.status = InvoiceStatus.PAID;
      await manager.save(Invoice, invoice);
    } else {
      await this.billing.recordPayment(booking!.id, booking!.userId, expected, order.orderId, manager);
      booking!.status = BookingStatus.PAID;
      await manager.save(Booking, booking!);
    }
    return { paid: true };
  }
}

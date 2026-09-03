import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity';
import { BookingService } from '../booking/booking.service';
import { FinancialService } from '../financial/financial.service';
import { InvoiceStatus } from '../financial/entities/invoice.entity';
import { User } from '../user/user-entity';

type PaylinkInvoice = { amount?: number; transactionNo?: string; orderStatus?: string; url?: string; success?: boolean; paymentErrors?: string | null };

@Injectable()
export class PaylinkService {
  private token: { value: string; expiresAt: number } | null = null;
  constructor(private readonly config: ConfigService, private readonly bookingService: BookingService, private readonly financialService: FinancialService, @InjectRepository(Booking) private readonly bookings: Repository<Booking>, @InjectRepository(User) private readonly users: Repository<User>) {}
  private baseUrl() { return this.config.get<string>('PAYLINK_BASE_URL') || 'https://restpilot.paylink.sa'; }
  private callbackUrl(kind: 'callback' | 'cancel') {
    const configured = this.config.get<string>(kind === 'callback' ? 'PAYLINK_CALLBACK_URL' : 'PAYLINK_CANCEL_URL');
    if (configured) return configured;
    const publicUrl = this.config.get<string>('API_PUBLIC_URL') || this.config.get<string>('PUBLIC_BASE_URL');
    if (!publicUrl) throw new InternalServerErrorException('Configure PAYLINK_CALLBACK_URL/PAYLINK_CANCEL_URL or API_PUBLIC_URL');
    return publicUrl.replace(/\/$/, '') + '/api/payment/paylink/' + kind;
  }
  private async authToken() {
    if (this.token && this.token.expiresAt > Date.now()) return this.token.value;
    const apiId = this.config.get<string>('PAYLINK_API_ID'); const secretKey = this.config.get<string>('PAYLINK_SECRET_KEY');
    if (!apiId || !secretKey) throw new InternalServerErrorException('Paylink credentials are not configured');
    const response = await fetch(this.baseUrl() + '/api/auth', { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ apiId, secretKey, persistToken: true }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.id_token) throw new BadRequestException(body.detail || body.message || 'Paylink authentication failed');
    this.token = { value: body.id_token, expiresAt: Date.now() + 29 * 60 * 60 * 1000 }; return body.id_token;
  }
  private async request<T>(path: string, init: RequestInit = {}) {
    const response = await fetch(this.baseUrl() + path, { ...init, headers: { accept: 'application/json', 'content-type': 'application/json', ...(init.headers || {}), Authorization: 'Bearer ' + await this.authToken() } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new BadRequestException(body.detail || body.message || 'Paylink request failed'); return body as T;
  }
  async createInvoice(params: { bookingId?: string; invoiceId?: string; customerMobile?: string; products?: Array<{ title: string; price: number; qty: number; description?: string; isDigital?: boolean; imageSrc?: string; specificVat?: number; productCost?: number }> }, user: User) {
    let amount = 0; let orderNumber = ''; let note = ''; let customer = user;
    if (params.bookingId) {
      const booking = await this.bookingService.findOne(params.bookingId, user);
      if (booking.status === BookingStatus.PAID) throw new BadRequestException('Booking already paid');
      amount = Number(booking.price); orderNumber = 'booking-' + booking.id; note = 'Booking ' + booking.id; customer = booking.user || user;
    } else if (params.invoiceId) {
      const invoice = await this.financialService.findInvoiceById(params.invoiceId);
      if (!invoice) throw new BadRequestException('Invoice not found'); if (invoice.status === InvoiceStatus.PAID) throw new BadRequestException('Invoice already paid');
      amount = Number(invoice.total); orderNumber = 'invoice-' + invoice.id; note = invoice.description || 'Invoice ' + invoice.id; customer = await this.users.findOne({ where: { id: invoice.userId } }) || user;
    } else throw new BadRequestException('Either bookingId or invoiceId is required');
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Invalid payment amount');
    const customerMobile = (params.customerMobile || customer.phone || '').trim();
    if (!customerMobile) throw new BadRequestException('A customer mobile number is required for Paylink');
    const result = await this.request<PaylinkInvoice>('/api/addInvoice', { method: 'POST', body: JSON.stringify({ orderNumber, amount: Number(amount.toFixed(2)), callBackUrl: this.callbackUrl('callback'), cancelUrl: this.callbackUrl('cancel'), clientName: ((customer.firstName || '') + ' ' + (customer.lastName || '')).trim() || 'Customer', clientEmail: customer.email || undefined, clientMobile: customerMobile, currency: 'SAR', note, products: params.products }) });
    if (!result.success || !result.url || !result.transactionNo) throw new BadRequestException(result.paymentErrors || 'Paylink did not create the invoice'); return { paymentUrl: result.url, transactionNo: result.transactionNo, orderNumber, amount: result.amount };
  }
  async cancelInvoice(transactionNo: string) {
    if (!transactionNo) throw new BadRequestException('transactionNo is required');
    return this.request('/api/cancelInvoice', { method: 'POST', body: JSON.stringify({ transactionNo }) });
  }

  async sendDigitalProduct(orderNumber: string, message: string) {
    if (!orderNumber || !message) throw new BadRequestException('orderNumber and message are required');
    return this.request('/api/sendDigitalProduct', { method: 'POST', body: JSON.stringify({ orderNumber, message }) });
  }

  async callback(orderNumber: string, transactionNo: string, cancelled = false) {
    if (!orderNumber || !transactionNo) throw new BadRequestException('Missing Paylink callback parameters');
    if (cancelled) await this.cancelInvoice(transactionNo);
    const remote = await this.request<PaylinkInvoice>('/api/getInvoice/' + encodeURIComponent(transactionNo)); const isBooking = orderNumber.startsWith('booking-'); const id = orderNumber.slice(8);
    const expected = isBooking ? Number((await this.bookings.findOne({ where: { id } }))?.price) : Number((await this.financialService.findInvoiceById(id))?.total);
    const paid = !cancelled && remote.orderStatus?.toUpperCase() === 'PAID' && Number(remote.amount) === expected;
    if (isBooking && paid) await this.bookingService.updateStatus(id, BookingStatus.PAID, { id: 'system', role: 'system' }); else if (!isBooking && orderNumber.startsWith('invoice-') && paid) await this.financialService.updateInvoiceStatus(id, InvoiceStatus.PAID); else if (!isBooking && !orderNumber.startsWith('invoice-')) throw new BadRequestException('Invalid Paylink order number');
    return { paid, orderNumber, transactionNo, status: remote.orderStatus };
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BookingService } from '../booking/booking.service';
import { BookingStatus } from '../booking/entities/booking.entity';
import { FinancialService } from '../financial/financial.service';
import { InvoiceStatus } from '../financial/entities/invoice.entity';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private bookingService: BookingService,
    private financialService: FinancialService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_placeholder';
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  async createPaymentIntent(params: { bookingId?: string; invoiceId?: string }, user: any) {
    let amount = 0;
    let metadata: any = { userId: user.id };

    if (params.bookingId) {
      const booking = await this.bookingService.findOne(params.bookingId, user);
      if (!booking) throw new BadRequestException('Booking not found');
      if (booking.status === BookingStatus.PAID) throw new BadRequestException('Booking already paid');
      if (!booking.price || booking.price <= 0) throw new BadRequestException('Invalid price');
      
      amount = Math.round(booking.price * 100);
      metadata.bookingId = booking.id;
    } else if (params.invoiceId) {
      const invoice = await this.financialService.findInvoiceById(params.invoiceId);
      if (!invoice) throw new BadRequestException('Invoice not found');
      if (invoice.status === InvoiceStatus.PAID) throw new BadRequestException('Invoice already paid');
      
      amount = Math.round(Number(invoice.total) * 100);
      metadata.invoiceId = invoice.id;
    } else {
      throw new BadRequestException('Either bookingId or invoiceId is required');
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: 'sar',
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    return { clientSecret: paymentIntent.client_secret };
  }

  async constructEventFromPayload(signature: string, payload: Buffer) {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      if (!webhookSecret) {
          throw new BadRequestException('STRIPE_WEBHOOK_SECRET not configured');
      }
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  async handleWebhook(event: Stripe.Event) {
      if (event.type === 'payment_intent.succeeded') {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const bookingId = paymentIntent.metadata.bookingId;
          const invoiceId = paymentIntent.metadata.invoiceId;
          
          // System user context for update
          const systemUser = { id: 'system', role: 'system' };
          
          if (bookingId) {
             console.log(`Payment succeeded for booking ${bookingId}`);
             await this.bookingService.updateStatus(bookingId, BookingStatus.PAID, systemUser);
             // TODO: Trigger notification to Agent?
          } else if (invoiceId) {
             console.log(`Payment succeeded for invoice ${invoiceId}`);
             await this.financialService.updateInvoiceStatus(invoiceId, InvoiceStatus.PAID);
          }
      }
  }
}

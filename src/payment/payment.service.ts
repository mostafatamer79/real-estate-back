import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BookingService } from '../booking/booking.service';
import { BookingStatus } from '../booking/entities/booking.entity';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private bookingService: BookingService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_placeholder';
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia' as any, // Using latest API version
    });
  }

  async createPaymentIntent(bookingId: string, user: any) {
    const booking = await this.bookingService.findOne(bookingId, user);

    if (!booking) {
        throw new BadRequestException('Booking not found');
    }
    
    if (booking.status === BookingStatus.PAID) {
         throw new BadRequestException('Booking is already paid');
    }
    
    if (!booking.price || booking.price <= 0) {
        throw new BadRequestException('Booking price is invalid');
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(booking.price * 100), // Convert to cents
      currency: 'sar', // Saudi Riyal
      metadata: {
        bookingId: booking.id,
        userId: user.id,
      },
      automatic_payment_methods: {
          enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
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
          
          // System user context for update
          const systemUser = { id: 'system', role: 'system' };
          
          if (bookingId) {
             console.log(`Payment succeeded for booking ${bookingId}`);
             await this.bookingService.updateStatus(bookingId, BookingStatus.PAID, systemUser);
             // TODO: Trigger notification to Agent?
          }
      }
  }
}

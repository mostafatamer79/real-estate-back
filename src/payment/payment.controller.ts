import { Controller, Post, UseGuards, Body, Req, Res, BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(@Body() body: { bookingId?: string; invoiceId?: string }, @Req() req) {
    return this.paymentService.createPaymentIntent(body, req.user);
  }

  @Post('webhook')
  async handleWebhook(@Req() req:any, @Res() res: any) {
      const sig = req.headers['stripe-signature'];
      if (!sig) {
          throw new BadRequestException('Missing stripe-signature header');
      }

      // Note: In NestJS main.ts, rawBody must be enabled: app.useBodyParser('json', { limit: '10mb' }); or app = await NestFactory.create(AppModule, { rawBody: true });
      const rawBody = req.rawBody; 
      if (!rawBody) {
           console.error('Raw body not available on request. Ensure app is configured with rawBody: true');
           throw new BadRequestException('Raw body not available');
      }

      let event;
      try {
          event = await this.paymentService.constructEventFromPayload(sig as string, rawBody);
      } catch (err) {
          console.error(`Webhook Error: ${err.message}`);
          throw new BadRequestException(`Webhook Error: ${err.message}`);
      }

      await this.paymentService.handleWebhook(event);
      res.json({ received: true });
  }
}


import { Controller, Post, Get, UseGuards, Body, Req, Res, BadRequestException, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PaymentService } from './payment.service';
import { PaylinkService } from './paylink.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService, private readonly paylinkService: PaylinkService) {}

  @Post('intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(@Body() body: { bookingId?: string; invoiceId?: string }, @Req() req) {
    return this.paymentService.createPaymentIntent(body, req.user);
  }

  @Post('paylink/invoice')
  @UseGuards(JwtAuthGuard)
  createPaylinkInvoice(@Body() body: { bookingId?: string; invoiceId?: string; products?: Array<{ title: string; price: number; qty: number; description?: string; isDigital?: boolean; imageSrc?: string; specificVat?: number; productCost?: number }> }, @Req() req) {
    return this.paylinkService.createInvoice(body, req.user);
  }

  @Post('paylink/cancel')
  @UseGuards(JwtAuthGuard)
  cancelInvoice(@Body() body: { transactionNo: string }) {
    return this.paylinkService.cancelInvoice(body.transactionNo);
  }

  @Post('paylink/digital-product')
  @UseGuards(JwtAuthGuard)
  sendDigitalProduct(@Body() body: { orderNumber: string; message: string }) {
    return this.paylinkService.sendDigitalProduct(body.orderNumber, body.message);
  }

  @Get('paylink/callback')
  @Public()
  callback(@Query('orderNumber') orderNumber: string, @Query('transactionNo') transactionNo: string) {
    return this.paylinkService.callback(orderNumber, transactionNo);
  }

  @Get('paylink/cancel')
  @Public()
  cancel(@Query('orderNumber') orderNumber: string, @Query('transactionNo') transactionNo: string) {
    return this.paylinkService.callback(orderNumber, transactionNo, true);
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


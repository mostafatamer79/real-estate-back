import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { ConfigModule } from '@nestjs/config';
import { BookingModule } from '../booking/booking.module';
import { FinancialModule } from '../financial/financial.module';

@Module({
  imports: [ConfigModule, BookingModule, FinancialModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}

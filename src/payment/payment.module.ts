import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaylinkService } from './paylink.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../booking/entities/booking.entity';
import { User } from '../user/user-entity';
import { PaymentController } from './payment.controller';
import { ConfigModule } from '@nestjs/config';
import { BookingModule } from '../booking/booking.module';
import { FinancialModule } from '../financial/financial.module';
import { Invoice } from '../financial/entities/invoice.entity';
import { GeideaController } from './geidea.controller';
import { GeideaService } from './geidea.service';
import { GeideaBillingService } from './geidea-billing.service';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [ConfigModule, BookingModule, FinancialModule, SubscriptionModule, TypeOrmModule.forFeature([Booking, User, Invoice])],
  controllers: [PaymentController, GeideaController],
  providers: [PaymentService, PaylinkService, GeideaService, GeideaBillingService],
  exports: [PaymentService],
})
export class PaymentModule {}

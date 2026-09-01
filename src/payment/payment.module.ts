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

@Module({
  imports: [ConfigModule, BookingModule, FinancialModule, TypeOrmModule.forFeature([Booking, User])],
  controllers: [PaymentController],
  providers: [PaymentService, PaylinkService],
  exports: [PaymentService],
})
export class PaymentModule {}

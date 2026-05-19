import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { AdminBookingController } from './admin-booking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { OffersModule } from '../offer/offers.module';
import { NotificationModule } from '../notification/notification.module';
import { SettingsModule } from '../settings/settings.module';
import { DepartmentsGuard } from '../common/guards/departments.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Booking]), OffersModule, NotificationModule, SettingsModule],
  controllers: [BookingController, AdminBookingController],
  providers: [BookingService, DepartmentsGuard],
  exports: [BookingService],
})
export class BookingModule {}

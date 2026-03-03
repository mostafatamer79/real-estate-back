import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequest } from './service-request.entity';
import { User } from '../user/user-entity';
import { Invoice } from '../financial/entities/invoice.entity';
import { ServiceRequestService } from './service-request.service';
import { ServiceRequestController } from './service-request.controller';
import { SettingsModule } from '../settings/settings.module';
import { MailModule } from '../mail/mail.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceRequest, User, Invoice]),
    SettingsModule,
    MailModule,
    NotificationModule,
  ],
  controllers: [ServiceRequestController],
  providers: [ServiceRequestService],
  exports: [ServiceRequestService]
})
export class ServiceRequestModule {}
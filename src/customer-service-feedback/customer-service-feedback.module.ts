import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerServiceFeedback } from './entities/customer-service-feedback.entity';
import { CustomerServiceFeedbackService } from './customer-service-feedback.service';
import { CustomerServiceFeedbackController } from './customer-service-feedback.controller';
import { User } from '../user/user-entity';
import { MailModule } from '../mail/mail.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerServiceFeedback, User]), MailModule, NotificationModule],
  controllers: [CustomerServiceFeedbackController],
  providers: [CustomerServiceFeedbackService],
})
export class CustomerServiceFeedbackModule {}

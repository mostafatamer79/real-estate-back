import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerServiceFeedback } from './entities/customer-service-feedback.entity';
import { CustomerServiceFeedbackService } from './customer-service-feedback.service';
import { CustomerServiceFeedbackController } from './customer-service-feedback.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerServiceFeedback])],
  controllers: [CustomerServiceFeedbackController],
  providers: [CustomerServiceFeedbackService],
})
export class CustomerServiceFeedbackModule {}


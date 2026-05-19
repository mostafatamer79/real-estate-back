import { IsEnum } from 'class-validator';
import { CustomerServiceFeedbackStatus } from '../entities/customer-service-feedback.entity';

export class UpdateCustomerServiceFeedbackDto {
  @IsEnum(CustomerServiceFeedbackStatus)
  status: CustomerServiceFeedbackStatus;
}


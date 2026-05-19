import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CustomerServiceContactMethod } from '../entities/customer-service-feedback.entity';

export class CreateCustomerServiceFeedbackDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsEnum(CustomerServiceContactMethod)
  contactMethod: CustomerServiceContactMethod;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phoneNumber?: string;

  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  pagePath?: string;
}


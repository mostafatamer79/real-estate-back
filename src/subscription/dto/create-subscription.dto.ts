import {
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
  IsUUID,
  IsDate,
  Min,
  IsBoolean,
} from 'class-validator';
import { PaymentMethod, SubscriptionType } from '../subscription.entity';
import { Type } from 'class-transformer';

export class CreateSubscriptionDto {
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsUUID()
  packageId?: string;

  @IsOptional()
  @IsString()
  departmentSlug?: string;

  @IsEnum(SubscriptionType)
  @IsOptional()
  subscriptionType?: SubscriptionType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  customPeriodMonths?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  noExpiry?: boolean;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  noExpiry?: boolean;
}

export class CancelSubscriptionDto {
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

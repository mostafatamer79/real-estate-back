import { IsEnum, IsNotEmpty, IsOptional, IsJSON, IsObject, IsString } from 'class-validator';
import { MarketingRequestType, MarketingRequestStatus } from '../entities/marketing-request.entity';

export class CreateMarketingRequestDto {
  @IsEnum(MarketingRequestType)
  @IsNotEmpty()
  type: MarketingRequestType;

  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}

export class UpdateMarketingRequestDto {
  @IsEnum(MarketingRequestStatus)
  @IsOptional()
  status?: MarketingRequestStatus;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}

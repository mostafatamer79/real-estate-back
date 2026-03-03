import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { MarketingCategory, MarketingFrequency } from '../entities/email-marketing.entity';
import { Role } from '../../user/user-entity';

export class CreateEmailMarketingDto {
  @IsEnum(MarketingCategory)
  category: MarketingCategory;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  linkedResourceType?: string;

  @IsOptional()
  @IsString()
  linkedResourceId?: string;

  @IsString()
  content: string;

  @IsEnum(MarketingFrequency)
  frequency: MarketingFrequency;

  @IsOptional()
  @IsEnum(Role)
  targetRole?: Role;
}

export class UpdateEmailMarketingDto {
  @IsOptional()
  @IsEnum(MarketingCategory)
  category?: MarketingCategory;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  linkedResourceType?: string;

  @IsOptional()
  @IsString()
  linkedResourceId?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(MarketingFrequency)
  frequency?: MarketingFrequency;

  @IsOptional()
  @IsEnum(Role)
  targetRole?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { IsEnum, IsString, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { MarketingCategory, MarketingFrequency, MarketingScheduleMode } from '../entities/email-marketing.entity';
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

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsString()
  content: string;

  @IsOptional()
  sortOrder?: number;

  @IsOptional()
  @IsEnum(MarketingScheduleMode)
  scheduleMode?: MarketingScheduleMode;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsEnum(MarketingFrequency)
  frequency: MarketingFrequency;

  @IsOptional()
  @IsEnum(Role)
  targetRole?: Role;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsString()
  mainCategory?: string;

  @IsOptional()
  @IsString()
  dealType?: string;

  @IsOptional()
  price?: number;

  @IsOptional()
  area?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsArray()
  mediaFiles?: string[];

  @IsOptional()
  details?: any;
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
  assignedTo?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  sortOrder?: number;

  @IsOptional()
  @IsEnum(MarketingScheduleMode)
  scheduleMode?: MarketingScheduleMode;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsEnum(MarketingFrequency)
  frequency?: MarketingFrequency;

  @IsOptional()
  @IsEnum(Role)
  targetRole?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsString()
  mainCategory?: string;

  @IsOptional()
  @IsString()
  dealType?: string;

  @IsOptional()
  price?: number;

  @IsOptional()
  area?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsArray()
  mediaFiles?: string[];

  @IsOptional()
  details?: any;
}

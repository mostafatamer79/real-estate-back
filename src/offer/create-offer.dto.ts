import {
  IsString, IsNumber, IsOptional, IsBoolean, IsArray,
  Min, Max, IsEnum, IsUrl
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateOfferDto {
  @IsString()
  propertyType: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  length?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  width?: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  area: number;

  @IsString()
  propertyAge: string;

  @IsString()
  direction: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsString()
  city: string;

  @IsString()
  neighborhood: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  streetWidth?: number;

  @IsString()
  deedType: string;

  @IsString()
  propertyCondition: string;

  // Detailed Information
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  rooms?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  livingRooms?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  kitchens?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  floors?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  apartments?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasMaidRoom?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasRoof?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasExternalAnnex?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  buildingArea?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasGarage?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasPool?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasElevator?: boolean;

  @IsOptional()
  @IsString()
  furnitureStatus?: string;

  // Attachments
  @IsOptional()
  @IsString()
  additionalNotes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  propertyDocuments?: string[];

  @IsOptional()
  @IsString()
  checkImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaFiles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  threeDVideos?: string[];

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateOfferDto extends PartialType(CreateOfferDto) {}
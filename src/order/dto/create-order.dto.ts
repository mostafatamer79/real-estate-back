import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Department } from '../../user/department.enum';

export class CreateOrderDto {
  @IsString()
  orderType: string;

  @IsString()
  propertyType: string;

  @IsString()
  city: string;

  @IsString()
  neighborhood: string;

  @IsNumber()
  area: number;

  @IsString()
  propertyAge: string;

  @IsString()
  deedType: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  rooms?: number;

  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  livingRooms?: number;

  @IsOptional()
  @IsNumber()
  kitchens?: number;

  @IsOptional()
  @IsNumber()
  floors?: number;

  @IsOptional()
  @IsNumber()
  apartments?: number;

  @IsOptional()
  hasMaidRoom?: boolean;

  @IsOptional()
  hasRoof?: boolean;

  @IsOptional()
  hasExternalAnnex?: boolean;

  @IsOptional()
  @IsNumber()
  buildingArea?: number;

  @IsOptional()
  hasGarage?: boolean;

  @IsOptional()
  hasPool?: boolean;

  @IsOptional()
  hasElevator?: boolean;

  @IsOptional()
  @IsString()
  furnitureStatus?: string;

  @IsOptional()
  @IsString()
  additionalDetails?: string;

  @IsOptional()
  @IsEnum(Department)
  department?: Department;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}

import { PartialType } from '@nestjs/mapped-types';
export class UpdateOrderDto extends PartialType(CreateOrderDto) {}

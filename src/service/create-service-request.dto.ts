// src/service-request/create-service-request.dto.ts
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ServiceCategory } from './service-request.entity';
import { ServiceStatus } from './service-request.entity';

export class CreateServiceRequestDto {
  @IsEnum(ServiceCategory)
  @IsNotEmpty()
  category: ServiceCategory;

  @IsString()
  @IsNotEmpty()
  serviceType: string;

  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  userId?: string; // If user is logged in
}
// src/service-request/update-service-request.dto.ts

export class UpdateServiceRequestDto {
  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsNumber()
  @IsOptional()
  finalCost?: number;

  @IsString()
  @IsOptional()
  assignedAgentId?: string;

  @IsOptional()
  assignedAt?: Date;

  @IsOptional()
  completedAt?: Date;
}
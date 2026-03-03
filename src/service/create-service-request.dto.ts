// src/service-request/create-service-request.dto.ts
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ServiceCategory, TargetDepartment } from './service-request.entity';
import { ServiceStatus } from './service-request.entity';

export class CreateServiceRequestDto {
  @IsEnum(ServiceCategory)
  @IsOptional()
  category: ServiceCategory;

  @IsString()
  @IsOptional()
  serviceType: string;

  @IsString()
  @IsOptional()
  clientName: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  @IsOptional()
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

  @IsEnum(TargetDepartment)
  @IsOptional()
  targetDepartment?: TargetDepartment;

  @IsOptional()
  firstParty?: any;

  @IsOptional()
  secondParty?: any;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  documentIds?: string[];
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

  @IsEnum(TargetDepartment)
  @IsOptional()
  targetDepartment?: TargetDepartment;

  @IsNumber()
  @IsOptional()
  price?: number;
}
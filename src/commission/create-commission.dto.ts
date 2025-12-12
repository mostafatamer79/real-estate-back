// src/commission/dto/create-commission.dto.ts
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CommissionStatus, CommissionType, PartyType } from './commission.entity';

class PartyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  idNumber: string;

  @IsEnum(PartyType)
  partyType: PartyType;

  @IsString()
  @IsOptional()
  agencyNumber?: string;

  @IsString()
  @IsOptional()
  propertyType?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  agreedPercentage?: number;
}

class BrokerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  license: string;

  @IsNumber()
  @Min(0)
  percentage: number;

  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsNotEmpty()
  email: string;
}

export class CreateCommissionDto {
  @IsEnum(CommissionType)
  @IsNotEmpty()
  type: CommissionType;

  @IsString()
  @IsNotEmpty()
  propertyType: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  neighborhood: string;

  @IsString()
  @IsNotEmpty()
  streetName: string;

  @IsString()
  @IsNotEmpty()
  planNumber: string;

  @IsString()
  @IsNotEmpty()
  plotNumber: string;

  @IsNumber()
  @Min(0)
  area: number;

  @IsString()
  @IsNotEmpty()
  deedNumber: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  propertyAge?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  numberOfFloors?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  numberOfUnits?: number;

  @IsString()
  @IsOptional()
  specifications?: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercentage: number;

  @ValidateNested()
  @Type(() => PartyDto)
  owner: PartyDto;

  @ValidateNested()
  @Type(() => PartyDto)
  buyer: PartyDto;

  @ValidateNested({ each: true })
  @Type(() => BrokerDto)
  @IsOptional()
  brokers?: BrokerDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateCommissionDto {
    @IsEnum(CommissionStatus)
    @IsOptional()
    status?: CommissionStatus;
  
    @IsNumber()
    @IsOptional()
    @Min(0)
    finalCommissionAmount?: number;
  
    @IsString()
    @IsOptional()
    rejectionReason?: string;
  
    @IsString()
    @IsOptional()
    notes?: string;
  }
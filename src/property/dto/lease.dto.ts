import { Type } from 'class-transformer';
import { ValidateNested, IsOptional, IsString, IsNotEmpty, IsDateString, IsNumber, IsEnum } from 'class-validator';
import { CreateTenantDto } from './tenant.dto';

export class CreateLeaseDto {
    @IsOptional()
    @IsString()
    unitId?: string;

    @IsOptional()
    @IsString()
    tenantId?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateTenantDto)
    tenant?: CreateTenantDto;

    @IsNotEmpty()
    @IsDateString()
    startDate: string;

    @IsNotEmpty()
    @IsDateString()
    endDate: string;

    @IsNotEmpty()
    @IsNumber()
    annualRent: number;

    @IsOptional()
    @IsEnum(['monthly', 'quarterly', 'semi-annual', 'annual'])
    paymentFrequency?: string;

    @IsOptional()
    @IsNumber()
    securityDeposit?: number;
    
    @IsOptional()
    @IsEnum(['held', 'partially_refunded', 'fully_refunded'])
    securityDepositStatus?: string;

    @IsOptional()
    @IsString()
    deductionReason?: string;
}

export class CreatePaymentDto {
    @IsNotEmpty()
    @IsString()
    leaseId: string;

    @IsNotEmpty()
    @IsDateString()
    dueDate: string;

    @IsNotEmpty()
    @IsNumber()
    amount: number;
    
    @IsOptional()
    @IsEnum(['paid', 'pending', 'overdue'])
    status?: string;
}

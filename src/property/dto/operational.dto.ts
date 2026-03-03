import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class CreateMaintenanceDto {
    @IsOptional()
    @IsString()
    propertyId?: string;

    @IsOptional()
    @IsString()
    unitId?: string;

    @IsNotEmpty()
    @IsEnum(['routine', 'emergency'])
    type: 'routine' | 'emergency';

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsOptional()
    @IsNumber()
    cost?: number;

    @IsOptional()
    @IsString()
    technicianName?: string;
    
    @IsOptional()
    @IsDateString()
    completedDate?: string;
}

export class CreateExpenseDto {
    @IsNotEmpty()
    @IsString()
    propertyId: string;

    @IsNotEmpty()
    @IsString()
    category: string;

    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @IsNotEmpty()
    @IsDateString()
    date: string;
    
    @IsOptional()
    @IsString()
    description?: string;
}

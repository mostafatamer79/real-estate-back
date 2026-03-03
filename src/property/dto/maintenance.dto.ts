import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMaintenanceRequestDto {
    @IsOptional()
    @IsUUID()
    propertyId?: string;

    @IsOptional()
    @IsUUID()
    unitId?: string;

    @IsNotEmpty()
    @IsEnum(['routine', 'emergency'])
    type: 'routine' | 'emergency';

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsNumber()
    cost?: number;

    @IsOptional()
    @IsString()
    technicianName?: string;

    @IsOptional()
    @IsString()
    completedDate?: string;
}

import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UnitType, OccupancyStatus } from '../entities/unit.entity';
import { CreateLeaseDto } from './lease.dto';

export class CreateUnitDto {
    @IsOptional()
    @IsString()
    propertyId?: string;

    @IsNotEmpty()
    @IsString()
    unitNumber: string;

    @IsNotEmpty()
    @IsEnum(UnitType)
    type: UnitType;

    @IsOptional()
    @IsNumber()
    area?: number;

    @IsOptional()
    @IsNumber()
    roomsCount?: number;
    
    @IsOptional()
    @IsNumber()
    bathroomsCount?: number;

    @IsOptional()
    @IsEnum(OccupancyStatus)
    occupancyStatus?: OccupancyStatus;

    @IsOptional()
    @IsDateString()
    expectedVacancyDate?: string;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateLeaseDto)
    leases?: CreateLeaseDto[];
}

export class UpdateUnitDto extends CreateUnitDto {}

import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDecimal, ValidateNested, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType } from '../entities/property.entity';
import { CreateUnitDto } from './unit.dto';

export class CreatePropertyDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    deedNumber?: string;

    @IsNotEmpty()
    @IsEnum(PropertyType)
    type: PropertyType;

    @IsOptional()
    @IsString()
    locationUrl?: string;

    @IsOptional()
    @ValidateNested()
    coordinates?: { lat: number; lng: number };

    @IsOptional()
    constructionDate?: string;

    @IsOptional()
    @IsNumber()
    purchasePrice?: number;
    
    @IsOptional()
    @IsString()
    ownerId?: string;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateUnitDto)
    units?: CreateUnitDto[];
}

export class UpdatePropertyDto extends CreatePropertyDto {}

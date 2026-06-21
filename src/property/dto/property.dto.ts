import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDecimal, ValidateNested, IsDateString, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
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

    // Offer-aligned fields
    @IsOptional()
    @IsString()
    propertyType?: string;

    @IsOptional()
    @IsNumber()
    length?: number;

    @IsOptional()
    @IsNumber()
    width?: number;

    @IsOptional()
    @IsNumber()
    area?: number;

    @IsOptional()
    @IsString()
    propertyAge?: string;

    @IsOptional()
    @IsString()
    direction?: string;

    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    neighborhood?: string;

    @IsOptional()
    @IsNumber()
    streetWidth?: number;

    @IsOptional()
    @IsString()
    deedType?: string;

    @IsOptional()
    @IsString()
    propertyCondition?: string;

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
    @IsBoolean()
    hasMaidRoom?: boolean;

    @IsOptional()
    @IsBoolean()
    hasRoof?: boolean;

    @IsOptional()
    @IsBoolean()
    hasExternalAnnex?: boolean;

    @IsOptional()
    @IsNumber()
    buildingArea?: number;

    @IsOptional()
    @IsBoolean()
    hasGarage?: boolean;

    @IsOptional()
    @IsBoolean()
    hasPool?: boolean;

    @IsOptional()
    @IsBoolean()
    hasElevator?: boolean;

    @IsOptional()
    @IsString()
    furnitureStatus?: string;

    @IsOptional()
    @IsString()
    additionalNotes?: string;

    @IsOptional()
    @IsString({ each: true })
    propertyDocuments?: string[];

    @IsOptional()
    @IsString()
    checkImage?: string;

    @IsOptional()
    @IsString({ each: true })
    mediaFiles?: string[];

    @IsOptional()
    @IsString({ each: true })
    threeDVideos?: string[];

    @IsOptional()
    @IsString()
    video3d?: string;

    @IsOptional()
    @IsString()
    dealType?: string;

    @IsOptional()
    @IsString()
    mainCategory?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsNumber()
    views?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    clientName?: string;

    @IsOptional()
    @IsString()
    clientPhone?: string;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateUnitDto)
    units?: CreateUnitDto[];
}

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {}

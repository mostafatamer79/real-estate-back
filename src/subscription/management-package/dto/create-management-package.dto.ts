import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateManagementPackageDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  yearlyPrice: number;

  @IsNumber()
  @Min(0)
  monthlyPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsArray()
  @IsString({ each: true })
  administrations: string[];

  @IsArray()
  @IsString({ each: true })
  services: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateManagementPackageDto {
    @IsOptional()
    @IsString()
    name?: string;
  
    @IsOptional()
    @IsNumber()
    @Min(0)
    yearlyPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    monthlyPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    discount?: number;
  
    @IsOptional()
    @IsString()
    description?: string;
  
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    features?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    administrations?: string[];
  
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    services?: string[];
  
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
  }

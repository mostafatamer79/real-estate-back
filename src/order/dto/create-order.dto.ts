import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  orderType: string;

  @IsString()
  propertyType: string;

  @IsString()
  city: string;

  @IsString()
  neighborhood: string;

  @IsNumber()
  area: number;

  @IsString()
  propertyAge: string;

  @IsString()
  deedType: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  additionalDetails?: string;
}

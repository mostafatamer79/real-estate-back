import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCustomerServiceFaqCategoryDto {
  @IsString()
  @MaxLength(255)
  nameAr: string;

  @IsString()
  @MaxLength(255)
  nameEn: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}


import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPlacesDto {
  @IsNumber()
  @Type(() => Number) // transforms query string to number
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Type(() => Number)
  radius?: number = 1000; // default 1000 meters
}

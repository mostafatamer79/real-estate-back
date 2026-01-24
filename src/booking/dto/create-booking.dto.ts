import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, IsDateString } from 'class-validator';
import { BookingType } from '../entities/booking.entity';

export class CreateBookingDto {
  @IsEnum(BookingType)
  @IsNotEmpty()
  type: BookingType;

  @IsDateString()
  @IsNotEmpty()
  bookingDate: string; // ISO Date string

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  offerId?: string;

  @IsUUID()
  @IsOptional()
  disputeId?: string;

  @IsUUID()
  @IsOptional()
  agentId?: string;
}


import { IsIn, IsNumber, IsOptional, IsUUID, Matches, Min, Max } from 'class-validator';

// Geidea GUIDs are hexadecimal 8-4-4-4-12 identifiers, but may not use an RFC UUID variant.
export const GEIDEA_GUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export class CreateGeideaSessionDto {
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(10000)
  walletTopupAmount?: number;

  @IsOptional()
  @IsIn(['ar', 'en'])
  language?: 'ar' | 'en';
}

export class VerifyGeideaOrderDto {
  @Matches(GEIDEA_GUID)
  orderId: string;
}

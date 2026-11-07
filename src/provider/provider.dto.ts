import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { Transform, type TransformFnParams } from "class-transformer";
import type { DeliveryMode } from "./provider-profile";

export class ProviderApplicationDto {
  @IsIn(["general", "notary"]) kind: "general" | "notary";
  @IsString() @MaxLength(100) city: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ArrayUnique()
  @IsString({ each: true })
  requestedCategories: string[];
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @ArrayUnique()
  @IsIn(["online", "in_person"], { each: true })
  deliveryModes: DeliveryMode[];
  @IsOptional() @IsString() @MaxLength(100) licenseNumber?: string;
  @IsOptional() @IsString() @MaxLength(2048) licenseDocument?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
export class ProviderReviewDto {
  @IsIn(["approved", "rejected", "suspended"]) status:
    | "approved"
    | "rejected"
    | "suspended";
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ArrayUnique()
  @IsString({ each: true })
  categories?: string[];
  @IsOptional() @IsIn(["fixed", "percentage"]) agreementType?:
    | "fixed"
    | "percentage";
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999)
  agreementValue?: number;
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999)
  minOffer?: number;
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999)
  maxOffer?: number;
  @IsOptional() @IsString() @MaxLength(2000) reviewNote?: string;
}
export class ProviderOfferDto {
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(9999999999) amount: number;
  @IsIn(["online", "in_person"]) deliveryMode: DeliveryMode;
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
}
export class ProviderControlsDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(9999999999)
  notaryPlatformFee: number;
  @Transform(({ obj, key }: TransformFnParams) => (obj as Record<string, unknown>)[key])
  @IsBoolean() onlineAllCities: boolean;
}

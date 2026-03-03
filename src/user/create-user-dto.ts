import { IsDate, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Length, MinLength } from "class-validator"
import { IsSaudiPhoneNumber } from "../validator/IsSaudiNumber"
import { Transform } from "class-transformer"
import { Role, FinancialAgreementType } from "./user-entity"

export class CreateUserDto{
    @IsOptional()
     firstName:string
     @IsOptional()
     lastName:string
     @IsOptional()
     @IsSaudiPhoneNumber()
     phone:string
     @IsOptional()
    @IsEmail()
    email:string
    @IsOptional()
    @IsDate()
    expiredOtp:Date

    @IsOptional()
    @IsEnum(Role)
    role: Role

    @IsOptional()
    @IsEnum(FinancialAgreementType)
    financialAgreementType: FinancialAgreementType

    @IsOptional()
    financialAgreementValue: number
    
    @IsOptional()
    nationalId: string

    @IsOptional()
    departmentPermissions: any
 }

 export class VerifyOtpDto {
    email?: string;
    phone?: string;
    otp: string;
  }

  export class UpdateUserDto {
    @IsOptional()
    @IsString()
    firstName?: string;
  
    @IsOptional()
    @IsString()
    lastName?: string;
  
    @IsOptional()
    @IsEnum(Role)
    role?: Role;
  
    @IsOptional()
    @IsString()
    agentLicenseNumber?: string;
  
    @IsOptional()
    @IsString()
    address?: string;
  
    @IsOptional()
    @IsString()
    city?: string;
  
    @IsOptional()
    @IsString()
    country?: string;
  
    @IsOptional()
    @IsString()
    profileImage?: string;
  
    @IsOptional()
    @IsString()
    idDocument?: string;
  
    @IsOptional()
    @IsString()
    licenseDocument?: string;

    @IsOptional()
    @IsString()
    falLicenseNumber?: string;

    @IsOptional()
    @Transform(({ value }) => value === "" ? null : value)
    falLicenseExpiry?: Date;

    @IsOptional()
    @IsString()
    lawLicenseNumber?: string;

    @IsOptional()
    @IsString()
    commercialRegistrationNumber?: string;

    @IsOptional()
    @IsString()
    roleOtherDescription?: string;

    @IsOptional()
    @IsString()
    nationalId?: string;

    @IsOptional()
    @IsString()
    postalCode?: string;

    @IsOptional()
    @IsString()
    streetName?: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsOptional()
    @IsString()
    additionalNumber?: string;

    @IsOptional()
    @IsString()
    unitNumber?: string;

    @IsOptional()
    @Transform(({ value }) => value === "" ? null : value)
    licenseIssueDate?: Date;

    @IsOptional()
    @IsString()
    brokerType?: 'individual' | 'office';

    @IsOptional()
    departmentPermissions?: any;
  }
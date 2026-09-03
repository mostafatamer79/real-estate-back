import { IsArray, IsDate, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Length, MinLength } from "class-validator"
import { IsSaudiPhoneNumber } from "../validator/IsSaudiNumber"
import { Transform } from "class-transformer"
import { Role, FinancialAgreementType, VerifyStatus } from "./user-entity"
import { Department } from "./department.enum"

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

    @IsOptional()
    @IsArray()
    @IsEnum(Department, { each: true })
    departments?: Department[]

    @IsOptional()
    @IsString()
    parentId?: string

    @IsOptional()
    hasFreeTrial?: boolean
 }

 export class VerifyOtpDto {
    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsNotEmpty()
    @IsString()
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
    @IsEnum(VerifyStatus)
    agentVerificationStatus?: VerifyStatus;

    // Compatibility for cached admin clients; mapped to agentVerificationStatus by the service.
    @IsOptional()
    @IsEnum(VerifyStatus)
    licenseVerificationStatus?: VerifyStatus;
  
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
  isActive?: boolean;

    @IsOptional()
    @IsString()
    nationalId?: string;

    @IsOptional()
    @Transform(({ value }) => value === "" ? null : value)
    licenseIssueDate?: Date;

    @IsOptional()
    @IsString()
    brokerType?: 'individual' | 'office';

    @IsOptional()
    departmentPermissions?: any;

    @IsOptional()
    @IsArray()
    @IsEnum(Department, { each: true })
    departments?: Department[];

    @IsOptional()
    @IsString()
    parentId?: string;

    @IsOptional()
    hasFreeTrial?: boolean;
  }

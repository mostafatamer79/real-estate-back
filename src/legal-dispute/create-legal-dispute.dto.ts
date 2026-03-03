// create-legal-dispute.dto.ts
import { IsString, IsOptional, IsEmail, IsPhoneNumber, IsObject, IsArray, IsEnum, IsNumber, ValidateIf } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import {
  PartyRole,
  IdType,
  DisputeType,
  ApplicantRole,
  ContractType,
  PartyType,
  LegalServiceType,
  ServiceStatus,
  LegalDisputeStatus
} from './legal-dispute.entity';

// ========== LEGAL DISPUTE DTOs ==========
export class PartyDto {
  @IsString()
  name: string;

  @IsEnum(PartyRole)
  role: PartyRole;

  @IsEnum(IdType)
  idType: IdType;

  @IsString()
  idNumber: string;

  @IsString()
  nationality: string;

  @IsString()
  city: string;

  @IsString()
  nationalAddress: string;

  @IsString()
  @IsPhoneNumber('SA')
  phone: string;

  @IsEmail()
  email: string;
}

export class PartyAgentDto {
  @IsString()
  name: string;

  @IsString()
  agencyNumber: string;

  @IsString()
  idNumber: string;

  @IsOptional()
  @IsString()
  documentId?: string;
}

export class CreateLegalDisputeDto {
  @IsObject()
  firstParty: PartyDto;

  @IsObject()
  secondParty: PartyDto;

  @IsOptional()
  @IsObject()
  firstPartyAgent?: PartyAgentDto;

  @IsOptional()
  @IsObject()
  secondPartyAgent?: PartyAgentDto;

  @IsOptional()
  @IsEnum(DisputeType)
  disputeType?: DisputeType;

  @IsOptional()
  @IsString()
  otherDisputeType?: string;

  @IsString()
  disputeDescription: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentIds?: string[];
}

export class UpdateLegalDisputeDto extends PartialType(CreateLegalDisputeDto) {
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  lawyerNotes?: string;
}

// ========== CONTRACT DTOs ==========
export class ContractPartyDto {
  @IsString()
  name: string;

  @IsEnum(PartyType)
  type: PartyType;

  @IsEnum(IdType)
  idType: IdType;

  @IsString()
  idNumber: string;

  @IsString()
  nationality: string;

  @IsString()
  city: string;

  @IsString()
  nationalAddress: string;

  @IsString()
  @IsPhoneNumber('SA')
  phone: string;

  @IsEmail()
  email: string;
}

export class ContractAgentDto {
  @IsString()
  name: string;

  @IsString()
  agencyNumber: string;

  @IsOptional()
  @IsString()
  documentId?: string;
}

export class PaymentDetailsDto {
  @IsString()
  amount: string;

  @IsString()
  method: string;

  @IsString()
  dueDates: string;
}

export class CreateContractDto {
  @IsEnum(ContractType)
  contractType: ContractType;

  @IsOptional()
  @IsString()
  otherContractType?: string;

  @ValidateIf((o) => o.contractType !== ContractType.REVIEW)
  @IsObject()
  firstParty?: ContractPartyDto;

  @IsOptional()
  @IsObject()
  firstPartyAgent?: ContractAgentDto;

  @ValidateIf((o) => o.contractType !== ContractType.REVIEW)
  @IsObject()
  secondParty?: ContractPartyDto;

  @IsOptional()
  @IsObject()
  secondPartyAgent?: ContractAgentDto;

  @IsOptional()
  @IsString()
  servicesDescription?: string;

  @IsOptional()
  @IsString()
  contractDuration?: string;

  @IsOptional()
  @IsObject()
  paymentDetails?: PaymentDetailsDto;

  @IsOptional()
  @IsString()
  rightsResponsibilities?: string;

  @IsOptional()
  @IsString()
  cancellationTerms?: string;

  @IsEnum(ApplicantRole)
  applicantRole: ApplicantRole;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contractDocumentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalDocumentIds?: string[];
}

export class UpdateContractDto extends PartialType(CreateContractDto) {
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @IsOptional()
  @IsString()
  contractContent?: string;

  @IsOptional()
  @IsString()
  contractNumber?: string;
}

// ========== LEGAL DOCUMENTATION DTOs ==========
export class LegalDocumentationPartyDto {
  @IsString()
  name: string;

  @IsString()
  idNumber: string;

  @IsEnum(IdType)
  idType: IdType;

  @IsOptional()
  @IsString()
  identityDocumentId?: string;
}

export class CreateLegalDocumentationDto {
  @IsObject()
  firstParty: LegalDocumentationPartyDto;

  @IsObject()
  secondParty: LegalDocumentationPartyDto;

  @IsOptional()
  @IsString()
  ownershipDeedDocumentId?: string;

  @IsOptional()
  @IsString()
  ownershipDeedNotes?: string;

  @IsOptional()
  @IsNumber()
  saleAmount?: number;

  @IsOptional()
  @IsString()
  saleAmountProofDocumentId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  otherDocumentIds?: string[];

  @IsOptional()
  @IsString()
  otherDocumentsNotes?: string;

  @IsOptional()
  @IsString()
  additionalRequirements?: string;
}

export class UpdateLegalDocumentationDto extends PartialType(CreateLegalDocumentationDto) {
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @IsOptional()
  @IsString()
  certificationNumber?: string;

  @IsOptional()
  @IsString()
  notaryNotes?: string;
}

// ========== OTHER LEGAL SERVICES DTOs ==========
export class CreateOtherLegalServiceDto {
  @IsEnum(LegalServiceType)
  serviceType: LegalServiceType;

  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  // For Consultations
  @IsOptional()
  @IsString()
  consultationTopic?: string;

  @IsOptional()
  @IsString()
  consultationDetails?: string;

  // For Reports
  @IsOptional()
  @IsString()
  userRole?: string;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsString()
  propertyLocation?: string;

  @IsOptional()
  @IsString()
  offerNumber?: string;

  @IsOptional()
  @IsString()
  legalStatus?: LegalDisputeStatus;

  @IsOptional()
  @IsString()
  reportDetails?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentIds?: string[];
}

export class UpdateOtherLegalServiceDto extends PartialType(CreateOtherLegalServiceDto) {
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @IsOptional()
  @IsString()
  response?: string;

  @IsOptional()
  @IsString()
  followUpNotes?: string;
}

// ========== SEARCH AND FILTER DTOs ==========
export class SearchLegalServicesDto {
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  contractNumber?: string;

  @IsOptional()
  @IsString()
  certificationNumber?: string;
}

export class StatsFilterDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class AddDocumentDto {
  @IsString()
  documentId: string;

  @IsOptional()
  @IsString()
  type?: 'contract' | 'agency' | 'additional' | 'general';
}

export class AssignToLawyerDto {
  @IsString()
  lawyerId: string;
}

export class ReviewContractDto {
  @IsString()
  reviewNotes: string;

  @IsEnum(ServiceStatus)
  status: ServiceStatus;
}

export class SignContractDto {
  @IsString()
  signedBy: string;
}

export class CertifyDocumentationDto {
  @IsString()
  certificationNumber: string;

  @IsString()
  notes: string;
}

export class RespondToServiceDto {
  @IsString()
  response: string;
}

// ========== QUERY PARAM DTOs ==========
export class PaginationDto {
  @IsOptional()
  skip?: number = 0;

  @IsOptional()
  take?: number = 50;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class LegalDisputeQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @IsOptional()
  @IsEnum(DisputeType)
  disputeType?: DisputeType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class ContractQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @IsOptional()
  @IsString()
  contractNumber?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class DocumentationQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @IsOptional()
  @IsString()
  certificationNumber?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class OtherServicesQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @IsOptional()
  @IsEnum(LegalServiceType)
  serviceType?: LegalServiceType;

  @IsOptional()
  @IsString()
  search?: string;
}

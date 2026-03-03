import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike, FindOptionsWhere } from 'typeorm';
import { Contract } from './contract.entity';
import {
  CreateLegalDisputeDto,
  UpdateLegalDisputeDto,
  CreateContractDto,
  UpdateContractDto,
  CreateLegalDocumentationDto,
  UpdateLegalDocumentationDto,
  CreateOtherLegalServiceDto,
  UpdateOtherLegalServiceDto
} from './create-legal-dispute.dto';
import { User } from '../user/user-entity';
import { Role } from '../user/user-entity';
import { LegalDispute, LegalDisputeStatus, ServiceStatus, DisputeType, ContractType, PartyType, IdType, ApplicantRole } from './legal-dispute.entity';
import { LegalDocumentation } from './legal-documentation.entity';
import { OtherLegalService } from './other-legal-services.entity';

@Injectable()
export class LegalServicesService {
  constructor(
    @InjectRepository(LegalDispute)
    private readonly legalDisputesRepository: Repository<LegalDispute>,

    @InjectRepository(Contract)
    private readonly contractsRepository: Repository<Contract>,

    @InjectRepository(LegalDocumentation)
    private readonly legalDocumentationsRepository: Repository<LegalDocumentation>,

    @InjectRepository(OtherLegalService)
    private readonly otherLegalServicesRepository: Repository<OtherLegalService>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ========== LEGAL DISPUTES ==========
  async createLegalDispute(dto: CreateLegalDisputeDto, userId: string): Promise<LegalDispute> {
    const dispute = new LegalDispute();
    dispute.userId = userId;
    dispute.firstParty = dto.firstParty;
    dispute.secondParty = dto.secondParty;

    // Handle optional fields with proper type checking
    if (dto.firstPartyAgent && dto.firstPartyAgent.name && dto.firstPartyAgent.agencyNumber) {
      dispute.firstPartyAgent = {
        name: dto.firstPartyAgent.name,
        agencyNumber: dto.firstPartyAgent.agencyNumber,
        idNumber: dto.firstPartyAgent.idNumber,
        documentId: dto.firstPartyAgent.documentId
      };
    }

    if (dto.secondPartyAgent && dto.secondPartyAgent.name && dto.secondPartyAgent.agencyNumber) {
      dispute.secondPartyAgent = {
        name: dto.secondPartyAgent.name,
        agencyNumber: dto.secondPartyAgent.agencyNumber,
        idNumber: dto.secondPartyAgent.idNumber,
        documentId: dto.secondPartyAgent.documentId
      };
    }

    dispute.disputeType = dto.disputeType || DisputeType.OTHER;
    dispute.otherDisputeType = dto.otherDisputeType;
    dispute.disputeDescription = dto.disputeDescription;
    dispute.documentIds = dto.documentIds || [];
    dispute.status = ServiceStatus.PENDING;
    dispute.createdAt = new Date();
    dispute.updatedAt = new Date();

    return this.legalDisputesRepository.save(dispute);
  }

  async getAllLegalDisputes(userId: string, userRole: Role, filters?: any): Promise<LegalDispute[]> {
    const query = this.legalDisputesRepository.createQueryBuilder('dispute');

    if (userRole !== Role.ADMIN) {
      query.where('dispute.userId = :userId', { userId });
    } else {
      query.where('1=1');
    }

    if (filters?.status) {
      query.andWhere('dispute.status = :status', { status: filters.status });
    }

    if (filters?.disputeType && filters.disputeType !== 'جميع') {
      query.andWhere('dispute.disputeType = :disputeType', { disputeType: filters.disputeType });
    }

    if (filters?.search) {
      query.andWhere(
        '(dispute.disputeDescription ILIKE :search OR ' +
        'dispute.otherDisputeType ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('dispute.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate)
      });
    }

    return query
      .orderBy('dispute.createdAt', 'DESC')
      .skip(filters?.skip || 0)
      .take(filters?.take || 50)
      .getMany();
  }

  async getLegalDisputeById(id: string, userId: string, userRole: Role): Promise<LegalDispute> {
    const query = this.legalDisputesRepository.createQueryBuilder('dispute')
      .where('dispute.id = :id', { id });

    if (userRole !== Role.ADMIN) {
      query.andWhere('dispute.userId = :userId', { userId });
    }

    const dispute = await query.getOne();

    if (!dispute) {
      throw new NotFoundException('Legal dispute not found');
    }

    return dispute;
  }

  async updateLegalDispute(id: string, dto: UpdateLegalDisputeDto, userId: string, userRole: Role): Promise<LegalDispute> {
    const dispute = await this.getLegalDisputeById(id, userId, userRole);

    if (userRole !== Role.ADMIN && dispute.userId !== userId) {
      throw new ForbiddenException('You can only update your own disputes');
    }

    // Update only provided fields
    if (dto.firstParty !== undefined) dispute.firstParty = dto.firstParty;
    if (dto.secondParty !== undefined) dispute.secondParty = dto.secondParty;
    if (dto.firstPartyAgent !== undefined) dispute.firstPartyAgent = dto.firstPartyAgent;
    if (dto.secondPartyAgent !== undefined) dispute.secondPartyAgent = dto.secondPartyAgent;
    if (dto.disputeType !== undefined) dispute.disputeType = dto.disputeType;
    if (dto.otherDisputeType !== undefined) dispute.otherDisputeType = dto.otherDisputeType;
    if (dto.disputeDescription !== undefined) dispute.disputeDescription = dto.disputeDescription;
    if (dto.documentIds !== undefined) dispute.documentIds = dto.documentIds;
    if (dto.status !== undefined) dispute.status = dto.status;
    if (dto.notes !== undefined) dispute.notes = dto.notes;
    if (dto.lawyerNotes !== undefined) dispute.lawyerNotes = dto.lawyerNotes;

    dispute.updatedAt = new Date();

    return this.legalDisputesRepository.save(dispute);
  }

  async deleteLegalDispute(id: string, userId: string, userRole: Role): Promise<void> {
    const dispute = await this.getLegalDisputeById(id, userId, userRole);

    if (userRole !== Role.ADMIN && dispute.userId !== userId) {
      throw new ForbiddenException('You can only delete your own disputes');
    }

    await this.legalDisputesRepository.remove(dispute);
  }

  async addDisputeDocument(id: string, documentId: string, userId: string): Promise<LegalDispute> {
    const dispute = await this.legalDisputesRepository.findOne({
      where: { id, userId }
    });

    if (!dispute) {
      throw new NotFoundException('Legal dispute not found');
    }

    if (!dispute.documentIds) {
      dispute.documentIds = [];
    }

    dispute.documentIds.push(documentId);
    dispute.updatedAt = new Date();

    return this.legalDisputesRepository.save(dispute);
  }

  // ========== CONTRACTS ==========
  async createContract(dto: CreateContractDto, userId: string): Promise<Contract> {
    // Generate contract number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${year}-12-31`);

    const count = await this.contractsRepository.count({
      where: {
        createdAt: Between(startOfYear, endOfYear)
      }
    });

    const contractNumber = `CONTRACT-${year}${month}-${String(count + 1).padStart(4, '0')}`;

    const contract = new Contract();
    const isReviewContract = dto.contractType === ContractType.REVIEW;
    contract.userId = userId;
    contract.contractType = dto.contractType;
    contract.otherContractType = dto.otherContractType;
    if (!isReviewContract && (!dto.firstParty || !dto.secondParty)) {
      throw new BadRequestException('firstParty and secondParty are required unless contract type is مراجعة العقود');
    }

    contract.firstParty = dto.firstParty || {
      name: '',
      type: PartyType.INDIVIDUAL,
      idType: IdType.IDENTITY,
      idNumber: '',
      nationality: '',
      city: '',
      nationalAddress: '',
      phone: '',
      email: ''
    };

    if (dto.firstPartyAgent && dto.firstPartyAgent.name && dto.firstPartyAgent.agencyNumber) {
      contract.firstPartyAgent = {
        name: dto.firstPartyAgent.name,
        agencyNumber: dto.firstPartyAgent.agencyNumber,
        documentId: dto.firstPartyAgent.documentId
      };
    }

    contract.secondParty = dto.secondParty || {
      name: '',
      type: PartyType.INDIVIDUAL,
      idType: IdType.IDENTITY,
      idNumber: '',
      nationality: '',
      city: '',
      nationalAddress: '',
      phone: '',
      email: ''
    };

    if (dto.secondPartyAgent && dto.secondPartyAgent.name && dto.secondPartyAgent.agencyNumber) {
      contract.secondPartyAgent = {
        name: dto.secondPartyAgent.name,
        agencyNumber: dto.secondPartyAgent.agencyNumber,
        documentId: dto.secondPartyAgent.documentId
      };
    }

    contract.servicesDescription = dto.servicesDescription;
    contract.contractDuration = dto.contractDuration;
    contract.paymentDetails = dto.paymentDetails;
    contract.rightsResponsibilities = dto.rightsResponsibilities;
    contract.cancellationTerms = dto.cancellationTerms;
    contract.applicantRole = dto.applicantRole || ApplicantRole.AGENT;
    contract.contractDocumentIds = dto.contractDocumentIds || [];
    contract.additionalDocumentIds = dto.additionalDocumentIds || [];
    contract.contractNumber = contractNumber;
    contract.status = ServiceStatus.PENDING;
    contract.createdAt = new Date();
    contract.updatedAt = new Date();

    return this.contractsRepository.save(contract);
  }

  async getAllContracts(userId: string, userRole: Role, filters?: any): Promise<Contract[]> {
    const query = this.contractsRepository.createQueryBuilder('contract');

    if (userRole !== Role.ADMIN) {
      query.where('contract.userId = :userId', { userId });
    } else {
      query.where('1=1');
    }

    if (filters?.status) {
      query.andWhere('contract.status = :status', { status: filters.status });
    }

    if (filters?.contractType && filters.contractType !== 'جميع') {
      query.andWhere('contract.contractType = :contractType', { contractType: filters.contractType });
    }

    if (filters?.contractNumber) {
      query.andWhere('contract.contractNumber LIKE :contractNumber', {
        contractNumber: `%${filters.contractNumber}%`
      });
    }

    if (filters?.search) {
      query.andWhere(
        'contract.servicesDescription ILIKE :search',
        { search: `%${filters.search}%` }
      );
    }

    return query
      .orderBy('contract.createdAt', 'DESC')
      .skip(filters?.skip || 0)
      .take(filters?.take || 50)
      .getMany();
  }

  async getContractById(id: string, userId: string, userRole: Role): Promise<Contract> {
    const query = this.contractsRepository.createQueryBuilder('contract')
      .where('contract.id = :id', { id });

    if (userRole !== Role.ADMIN) {
      query.andWhere('contract.userId = :userId', { userId });
    }

    const contract = await query.getOne();

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  async updateContract(id: string, dto: UpdateContractDto, userId: string, userRole: Role): Promise<Contract> {
    const contract = await this.getContractById(id, userId, userRole);

    if (userRole !== Role.ADMIN && contract.userId !== userId) {
      throw new ForbiddenException('You can only update your own contracts');
    }

    // Update only provided fields
    Object.keys(dto).forEach(key => {
      if (dto[key] !== undefined && dto[key] !== null) {
        contract[key] = dto[key];
      }
    });

    contract.updatedAt = new Date();

    return this.contractsRepository.save(contract);
  }

  async signContract(id: string, signedBy: string, userId: string): Promise<Contract> {
    const contract = await this.contractsRepository.findOne({
      where: { id, userId }
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.status !== 'مكتملة') {
      throw new BadRequestException('Contract must be completed before signing');
    }

    contract.signedAt = new Date();
    contract.signedBy = signedBy;
    contract.updatedAt = new Date();

    return this.contractsRepository.save(contract);
  }

  // ========== LEGAL DOCUMENTATION ==========
  async createLegalDocumentation(dto: CreateLegalDocumentationDto, userId: string): Promise<LegalDocumentation> {
    const documentation = new LegalDocumentation();
    documentation.userId = userId;
    documentation.firstParty = dto.firstParty;
    documentation.secondParty = dto.secondParty;
    documentation.ownershipDeedDocumentId = dto.ownershipDeedDocumentId;
    documentation.ownershipDeedNotes = dto.ownershipDeedNotes;
    documentation.saleAmount = dto.saleAmount;
    documentation.saleAmountProofDocumentId = dto.saleAmountProofDocumentId;
    documentation.otherDocumentIds = dto.otherDocumentIds || [];
    documentation.otherDocumentsNotes = dto.otherDocumentsNotes;
    documentation.additionalRequirements = dto.additionalRequirements;
    documentation.status = 'معلقة';
    documentation.createdAt = new Date();
    documentation.updatedAt = new Date();

    return this.legalDocumentationsRepository.save(documentation);
  }

  async getAllLegalDocumentations(userId: string, userRole: Role, filters?: any): Promise<LegalDocumentation[]> {
    const query = this.legalDocumentationsRepository.createQueryBuilder('doc');

    if (userRole !== Role.ADMIN) {
      query.where('doc.userId = :userId', { userId });
    } else {
      query.where('1=1');
    }

    if (filters?.status) {
      query.andWhere('doc.status = :status', { status: filters.status });
    }

    if (filters?.certificationNumber) {
      query.andWhere('doc.certificationNumber LIKE :certificationNumber', {
        certificationNumber: `%${filters.certificationNumber}%`
      });
    }

    if (filters?.search) {
      query.andWhere(
        '(doc.certificationNumber ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return query
      .orderBy('doc.createdAt', 'DESC')
      .skip(filters?.skip || 0)
      .take(filters?.take || 50)
      .getMany();
  }

  // ========== OTHER LEGAL SERVICES ==========
  async createOtherLegalService(dto: CreateOtherLegalServiceDto, userId: string): Promise<OtherLegalService> {
    const service = new OtherLegalService();
    service.userId = userId;
    service.serviceType = dto.serviceType;
    service.name = dto.name;
    service.phone = dto.phone;
    service.email = dto.email;
    service.consultationTopic = dto.consultationTopic || undefined;
    service.consultationDetails = dto.consultationDetails;
    service.userRole = dto.userRole;
    service.propertyType = dto.propertyType;
    service.propertyLocation = dto.propertyLocation;
    service.offerNumber = dto.offerNumber;
    service.legalStatus = dto.legalStatus;
    service.reportDetails = dto.reportDetails;
    service.documentIds = dto.documentIds || [];
    service.status = 'معلقة';
    service.createdAt = new Date();
    service.updatedAt = new Date();

    return this.otherLegalServicesRepository.save(service);
  }

  async getAllOtherLegalServices(userId: string, userRole: Role, filters?: any): Promise<OtherLegalService[]> {
    const query = this.otherLegalServicesRepository.createQueryBuilder('service');

    if (userRole !== Role.ADMIN) {
      query.where('service.userId = :userId', { userId });
    } else {
      query.where('1=1');
    }

    if (filters?.status) {
      query.andWhere('service.status = :status', { status: filters.status });
    }

    if (filters?.serviceType && filters.serviceType !== 'جميع') {
      query.andWhere('service.serviceType = :serviceType', { serviceType: filters.serviceType });
    }

    if (filters?.search) {
      query.andWhere(
        '(service.name ILIKE :search OR ' +
        'service.phone ILIKE :search OR ' +
        'service.consultationTopic ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return query
      .orderBy('service.createdAt', 'DESC')
      .skip(filters?.skip || 0)
      .take(filters?.take || 50)
      .getMany();
  }

  async respondToLegalService(id: string, response: string, userId: string): Promise<OtherLegalService> {
    const service = await this.otherLegalServicesRepository.findOne({ where: { id } });

    if (!service) {
      throw new NotFoundException('Legal service not found');
    }

    service.response = response;
    service.respondedAt = new Date();
    service.respondedBy = userId;
    service.status = 'مكتملة';
    service.updatedAt = new Date();

    return this.otherLegalServicesRepository.save(service);
  }

  // ========== STATISTICS & REPORTS ==========
  async getLegalServicesStats(userId: string, userRole: Role, filters?: any): Promise<any> {
    const where: any = {};
    const userWhere: any = userRole !== Role.ADMIN ? { userId } : {};

    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(
        new Date(filters.startDate),
        new Date(filters.endDate)
      );
    }

    const [disputes, contracts, documentations, otherServices] = await Promise.all([
      this.legalDisputesRepository.find({ where: { ...userWhere, ...where } }),
      this.contractsRepository.find({ where: { ...userWhere, ...where } }),
      this.legalDocumentationsRepository.find({ where: { ...userWhere, ...where } }),
      this.otherLegalServicesRepository.find({ where: { ...userWhere, ...where } })
    ]);

    return {
      totalServices: disputes.length + contracts.length + documentations.length + otherServices.length,
      disputes: {
        total: disputes.length,
        byType: this.groupBy(disputes, 'disputeType'),
        byStatus: this.groupBy(disputes, 'status')
      },
      contracts: {
        total: contracts.length,
        byType: this.groupBy(contracts, 'contractType'),
        byStatus: this.groupBy(contracts, 'status'),
        signed: contracts.filter(c => c.signedAt).length
      },
      documentations: {
        total: documentations.length,
        byStatus: this.groupBy(documentations, 'status'),
        certified: documentations.filter(d => d.certifiedAt).length
      },
      otherServices: {
        total: otherServices.length,
        byType: this.groupBy(otherServices, 'serviceType'),
        byStatus: this.groupBy(otherServices, 'status'),
        responded: otherServices.filter(s => s.respondedAt).length
      }
    };
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = item[key];
      if (value !== undefined && value !== null) {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {});
  }

  // ========== SEARCH ==========
  async searchLegalServices(searchTerm: string, userId: string, userRole: Role): Promise<any> {
    const disputesQuery = this.legalDisputesRepository.createQueryBuilder('dispute');

    if (userRole !== Role.ADMIN) {
      disputesQuery.where('dispute.userId = :userId', { userId });
    }

    disputesQuery.andWhere(
      '(dispute.disputeDescription ILIKE :search OR ' +
      'dispute.otherDisputeType ILIKE :search)',
      { search: `%${searchTerm}%` }
    );

    const disputes = await disputesQuery.take(10).getMany();

    const contractsQuery = this.contractsRepository.createQueryBuilder('contract');

    if (userRole !== Role.ADMIN) {
      contractsQuery.where('contract.userId = :userId', { userId });
    }

    contractsQuery.andWhere(
      'contract.servicesDescription ILIKE :search',
      { search: `%${searchTerm}%` }
    );

    const contracts = await contractsQuery.take(10).getMany();

    const otherServicesQuery = this.otherLegalServicesRepository.createQueryBuilder('service');

    if (userRole !== Role.ADMIN) {
      otherServicesQuery.where('service.userId = :userId', { userId });
    }

    otherServicesQuery.andWhere(
      '(service.name ILIKE :search OR ' +
      'service.consultationTopic ILIKE :search)',
      { search: `%${searchTerm}%` }
    );

    const otherServices = await otherServicesQuery.take(10).getMany();

    return {
      disputes,
      contracts,
      otherServices
    };
  }
  // Add this method to legal-services.service.ts
async getOtherLegalServiceById(id: string, userId: string, userRole: Role): Promise<OtherLegalService> {
  const query = this.otherLegalServicesRepository.createQueryBuilder('service')
    .where('service.id = :id', { id });

  if (userRole !== Role.ADMIN) {
    query.andWhere('service.userId = :userId', { userId });
  }

  const service = await query.getOne();

  if (!service) {
    throw new NotFoundException('Legal service not found');
  }

  return service;
}
// Add this method to legal-services.service.ts if missing
async reviewContract(id: string, reviewNotes: string, status: ServiceStatus, userId: string, userRole: Role): Promise<Contract> {
  // In a real implementation, you would check if user is admin or lawyer
  // For now, we'll allow any user to review their own contracts

  const contract = await this.contractsRepository.findOne({ where: { id } });

  if (!contract) {
    throw new NotFoundException('Contract not found');
  }

  // Check if user can review this contract
  if (userRole !== Role.ADMIN && contract.userId !== userId) {
    throw new ForbiddenException('You can only review your own contracts');
  }

  contract.reviewNotes = reviewNotes;
  contract.status = status;
  contract.updatedAt = new Date();

  return this.contractsRepository.save(contract);
}

// Add this method to legal-services.service.ts if missing
async certifyDocumentation(id: string, certificationNumber: string, notes: string, userId: string, userRole: Role): Promise<LegalDocumentation> {
  const documentation = await this.legalDocumentationsRepository.findOne({ where: { id } });

  if (!documentation) {
    throw new NotFoundException('Documentation not found');
  }

  // In real implementation, check if user is admin or notary
  // For now, allow any user to certify their own documentation
  if (userRole !== Role.ADMIN && documentation.userId !== userId) {
    throw new ForbiddenException('You can only certify your own documentation');
  }

  documentation.certificationNumber = certificationNumber;
  documentation.certifiedAt = new Date();

  documentation.status = 'مكتملة';
  documentation.updatedAt = new Date();

  return this.legalDocumentationsRepository.save(documentation);
}
}

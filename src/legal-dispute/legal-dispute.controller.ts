// legal-services.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';

import { Role } from '../user/user-entity';
import { LegalServicesService } from './legal-services.service';
import {
  CreateLegalDisputeDto,
  UpdateLegalDisputeDto,
  CreateContractDto,
  UpdateContractDto,
  CreateLegalDocumentationDto,
  UpdateLegalDocumentationDto,
  CreateOtherLegalServiceDto,
  UpdateOtherLegalServiceDto,
  SearchLegalServicesDto,
  StatsFilterDto,
  AddDocumentDto,
  AssignToLawyerDto,
  ReviewContractDto,
  SignContractDto,
  CertifyDocumentationDto,
  RespondToServiceDto,
  LegalDisputeQueryDto,
  ContractQueryDto,
  DocumentationQueryDto,
  OtherServicesQueryDto,
  PaginationDto
} from './create-legal-dispute.dto';
import { Roles } from 'src/common/decorators/roles.decorators';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@ApiTags('Legal Services')
@Controller('legal-services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class LegalServicesController {
  constructor(private readonly legalServicesService: LegalServicesService) {}

  // ========== LEGAL DISPUTES ==========
  @Post('disputes')
  @ApiOperation({ summary: 'Create a new legal dispute' })
  @ApiResponse({ status: 201, description: 'Legal dispute created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createLegalDispute(
    @Body() dto: CreateLegalDisputeDto,
    @Request() req
  ) {
    return this.legalServicesService.createLegalDispute(dto, req.user.userId);
  }

  @Get('disputes')
  @ApiOperation({ summary: 'Get all legal disputes with filtering' })
  @ApiQuery({ name: 'status', required: false, enum: ['معلقة', 'قيد المعالجة', 'مكتملة', 'ملغاة'] })
  @ApiQuery({ name: 'disputeType', required: false, enum: ['نزاعات الملكية', 'عقود البيع والإيجار', 'قضايا الرهن العقاري', 'مخالفات البناء', 'نزع الملكية للمصلحة العامة', 'مشاكل في مشاريع التطوير', 'قضايا التركات العقارية', 'اخرى'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async getAllLegalDisputes(
    @Request() req,
    @Query() query: LegalDisputeQueryDto
  ) {
    return this.legalServicesService.getAllLegalDisputes(
      req.user.userId,
      req.user.role,
      query
    );
  }

  @Get('disputes/:id')
  @ApiOperation({ summary: 'Get legal dispute by ID' })
  @ApiResponse({ status: 200, description: 'Legal dispute found' })
  @ApiResponse({ status: 404, description: 'Legal dispute not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
  async getLegalDisputeById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req
  ) {
    return this.legalServicesService.getLegalDisputeById(
      id,
      req.user.userId,
      req.user.role
    );
  }

  @Put('disputes/:id')
  @ApiOperation({ summary: 'Update legal dispute' })
  @ApiResponse({ status: 200, description: 'Legal dispute updated successfully' })
  @ApiResponse({ status: 404, description: 'Legal dispute not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot update other user\'s dispute' })
  async updateLegalDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLegalDisputeDto,
    @Request() req
  ) {
    return this.legalServicesService.updateLegalDispute(
      id,
      dto,
      req.user.userId,
      req.user.role
    );
  }

  @Delete('disputes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete legal dispute' })
  @ApiResponse({ status: 204, description: 'Legal dispute deleted successfully' })
  @ApiResponse({ status: 404, description: 'Legal dispute not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot delete other user\'s dispute' })
  async deleteLegalDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req
  ) {
    return this.legalServicesService.deleteLegalDispute(
      id,
      req.user.userId,
      req.user.role
    );
  }

  @Post('disputes/:id/documents')
  @ApiOperation({ summary: 'Add document to legal dispute' })
  @ApiResponse({ status: 200, description: 'Document added successfully' })
  @ApiResponse({ status: 404, description: 'Legal dispute not found' })
  async addDisputeDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AddDocumentDto,
    @Request() req
  ) {
    return this.legalServicesService.addDisputeDocument(
      id,
      body.documentId,
      req.user.userId
    );
  }


  // ========== CONTRACTS ==========
  @Post('contracts')
  @ApiOperation({ summary: 'Create a new contract' })
  @ApiResponse({ status: 201, description: 'Contract created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createContract(
    @Body() dto: CreateContractDto,
    @Request() req
  ) {
    return this.legalServicesService.createContract(dto, req.user.userId);
  }

  @Get('contracts')
  @ApiOperation({ summary: 'Get all contracts with filtering' })
  @ApiQuery({ name: 'status', required: false, enum: ['معلقة', 'قيد المراجعة', 'معدلة', 'مكتملة', 'ملغاة'] })
  @ApiQuery({ name: 'contractType', required: false, enum: ['عقد البيع', 'عقد الإيجار', 'عقد الانتفاع العقاري', 'عقد الهبة العقاري', 'عقد الرهن العقاري', 'عقد الاستثمار العقاري', 'مراجعة العقود', 'اخرى'] })
  @ApiQuery({ name: 'contractNumber', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async getAllContracts(
    @Request() req,
    @Query() query: ContractQueryDto
  ) {
    return this.legalServicesService.getAllContracts(
      req.user.userId,
      req.user.role,
      query
    );
  }

  @Get('contracts/:id')
  @ApiOperation({ summary: 'Get contract by ID' })
  @ApiResponse({ status: 200, description: 'Contract found' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async getContractById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req
  ) {
    return this.legalServicesService.getContractById(
      id,
      req.user.userId,
      req.user.role
    );
  }

  @Put('contracts/:id')
  @ApiOperation({ summary: 'Update contract' })
  @ApiResponse({ status: 200, description: 'Contract updated successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot update other user\'s contract' })
  async updateContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContractDto,
    @Request() req
  ) {
    return this.legalServicesService.updateContract(
      id,
      dto,
      req.user.userId,
      req.user.role
    );
  }

  @Put('contracts/:id/sign')
  @ApiOperation({ summary: 'Sign contract' })
  @ApiResponse({ status: 200, description: 'Contract signed successfully' })
  @ApiResponse({ status: 400, description: 'Contract must be completed before signing' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async signContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SignContractDto,
    @Request() req
  ) {
    return this.legalServicesService.signContract(
      id,
      body.signedBy,
      req.user.userId
    );
  }

  @Put('contracts/:id/review')
  @ApiOperation({ summary: 'Review contract (Admin/Lawyer only)' })
  async reviewContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ReviewContractDto,
    @Request() req
  ) {
    return this.legalServicesService.reviewContract(
      id,
      body.reviewNotes,
      body.status,
      req.user.userId,
      req.user.role
    );
  }

  // ========== LEGAL DOCUMENTATION ==========
  @Post('documentations')
  @ApiOperation({ summary: 'Create legal documentation request' })
  @ApiResponse({ status: 201, description: 'Documentation request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createLegalDocumentation(
    @Body() dto: CreateLegalDocumentationDto,
    @Request() req
  ) {
    return this.legalServicesService.createLegalDocumentation(dto, req.user.userId);
  }

  @Get('documentations')
  @ApiOperation({ summary: 'Get all legal documentations' })
  @ApiQuery({ name: 'status', required: false, enum: ['معلقة', 'قيد التوثيق', 'مكتملة', 'ملغاة'] })
  @ApiQuery({ name: 'certificationNumber', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async getAllLegalDocumentations(
    @Request() req,
    @Query() query: DocumentationQueryDto
  ) {
    return this.legalServicesService.getAllLegalDocumentations(
      req.user.userId,
      req.user.role,
      query
    );
  }

  @Put('documentations/:id/certify')
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Certify documentation (Admin/Notary only)' })
  async certifyDocumentation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CertifyDocumentationDto,
    @Request() req
  ) {
    return this.legalServicesService.certifyDocumentation(
      id,
      body.certificationNumber,
      body.notes,
      req.user.userId,
      req.user.role
    );
  }

  // ========== OTHER LEGAL SERVICES ==========
  @Post('other-services')
  @ApiOperation({ summary: 'Create other legal service request' })
  @ApiResponse({ status: 201, description: 'Service request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createOtherLegalService(
    @Body() dto: CreateOtherLegalServiceDto,
    @Request() req
  ) {
    return this.legalServicesService.createOtherLegalService(dto, req.user.userId);
  }

  @Get('other-services')
  @ApiOperation({ summary: 'Get all other legal services' })
  @ApiQuery({ name: 'status', required: false, enum: ['معلقة', 'قيد المعالجة', 'مكتملة', 'ملغاة'] })
  @ApiQuery({ name: 'serviceType', required: false, enum: ['استشارات قانونية', 'تقارير قانونية'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async getAllOtherLegalServices(
    @Request() req,
    @Query() query: OtherServicesQueryDto
  ) {
    return this.legalServicesService.getAllOtherLegalServices(
      req.user.userId,
      req.user.role,
      query
    );
  }

  @Get('other-services/:id')
  @ApiOperation({ summary: 'Get other legal service by ID' })
  @ApiResponse({ status: 200, description: 'Service found' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async getOtherLegalServiceById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req
  ) {
    return this.legalServicesService.getOtherLegalServiceById(
      id,
      req.user.userId,
      req.user.role
    );
  }

  @Put('other-services/:id/respond')
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Respond to legal service (Admin/Lawyer only)' })
  async respondToLegalService(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RespondToServiceDto,
    @Request() req
  ) {
    return this.legalServicesService.respondToLegalService(
      id,
      body.response,
      req.user.userId,
    );
  }

  // ========== STATISTICS & REPORTS ==========
  @Get('stats')
  @ApiOperation({ summary: 'Get legal services statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getLegalServicesStats(
    @Request() req,
    @Query() query: StatsFilterDto
  ) {
    return this.legalServicesService.getLegalServicesStats(
      req.user.userId,
      req.user.role,
      query
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search across all legal services' })
  @ApiQuery({ name: 'q', required: true, description: 'Search term' })
  async searchLegalServices(
    @Query('q') searchTerm: string,
    @Request() req
  ) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new BadRequestException('Search term must be at least 2 characters long');
    }

    return this.legalServicesService.searchLegalServices(
      searchTerm.trim(),
      req.user.userId,
      req.user.role
    );
  }

  // ========== FILE UPLOAD ENDPOINTS ==========
  @Post('upload-documents')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary'
          }
        },
        serviceType: {
          type: 'string',
          enum: ['dispute', 'contract', 'documentation', 'other'],
          description: 'Type of legal service'
        },
        serviceId: {
          type: 'string',
          description: 'ID of the legal service (optional for new services)'
        },
        documentType: {
          type: 'string',
          enum: ['contract', 'agency', 'additional', 'general'],
          description: 'Type of document (for contracts)'
        }
      }
    }
  })
  @ApiOperation({ summary: 'Upload documents for legal services' })
  async uploadDocuments(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: {
      serviceType: 'dispute' | 'contract' | 'documentation' | 'other';
      serviceId?: string;
      documentType?: 'contract' | 'agency' | 'additional' | 'general';
    },
    @Request() req
  ) {
    // In a real implementation, you would:
    // 1. Save files to storage (S3, local storage, etc.)
    // 2. Generate document IDs
    // 3. Link documents to the appropriate service
    // 4. Return document information

    return {
      message: 'Files uploaded successfully',
      files: files.map(file => ({
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        // In real implementation, return the stored file URL
        url: `/uploads/${file.filename}`
      })),
      serviceType: body.serviceType,
      serviceId: body.serviceId,
      documentType: body.documentType
    };
  }

  // ========== UTILITY ENDPOINTS ==========
  @Get('enums')
  @ApiOperation({ summary: 'Get all enums used in legal services' })
  async getEnums() {
    return {
      partyRoles: {
        SELLER: 'بائع',
        BUYER: 'مشتري',
        BROKER: 'وسيط'
      },
      idTypes: {
        IDENTITY: 'هوية',
        RESIDENCE: 'إقامة',
        COMMERCIAL_REGISTER: 'سجل تجاري'
      },
      partyTypes: {
        INDIVIDUAL: 'فرد',
        COMPANY: 'شركة'
      },
      disputeTypes: {
        PROPERTY_DISPUTES: 'نزاعات الملكية',
        SALE_RENTAL_CONTRACTS: 'عقود البيع والإيجار',
        MORTGAGE_CASES: 'قضايا الرهن العقاري',
        BUILDING_VIOLATIONS: 'مخالفات البناء',
        EXPROPRIATION: 'نزع الملكية للمصلحة العامة',
        DEVELOPMENT_PROJECTS: 'مشاكل في مشاريع التطوير',
        INHERITANCE_DISPUTES: 'قضايا التركات العقارية',
        OTHER: 'اخرى'
      },
      contractTypes: {
        SALE: 'عقد البيع',
        RENTAL: 'عقد الإيجار',
        USUFRUCT: 'عقد الانتفاع العقاري',
        GIFT: 'عقد الهبة العقاري',
        MORTGAGE: 'عقد الرهن العقاري',
        INVESTMENT: 'عقد الاستثمار العقاري',
        REVIEW: 'مراجعة العقود',
        OTHER: 'اخرى'
      },
      serviceStatuses: {
        PENDING: 'معلقة',
        IN_PROGRESS: 'قيد المعالجة',
        UNDER_REVIEW: 'قيد المراجعة',
        MODIFIED: 'معدلة',
        COMPLETED: 'مكتملة',
        CANCELLED: 'ملغاة',
        CERTIFIED: 'موثق',
        UNDER_DOCUMENTATION: 'قيد التوثيق'
      },
      applicantRoles: {
        FIRST_PARTY: 'الطرف الاول',
        SECOND_PARTY: 'الطرف الثاني',
        AGENT: 'الوكيل'
      },
      legalServiceTypes: {
        CONSULTATION: 'استشارات قانونية',
        REPORT: 'تقارير قانونية'
      }
    };
  }

  @Get('user-stats')
  @ApiOperation({ summary: 'Get user-specific statistics' })
  async getUserLegalStats(@Request() req) {
    const stats = await this.legalServicesService.getLegalServicesStats(
      req.user.userId,
      req.user.role,
      {}
    );

    return {
      userId: req.user.userId,
      totalServices: stats.totalServices,
      disputes: {
        total: stats.disputes.total,
        pending: stats.disputes.byStatus['معلقة'] || 0,
        inProgress: stats.disputes.byStatus['قيد المعالجة'] || 0,
        completed: stats.disputes.byStatus['مكتملة'] || 0
      },
      contracts: {
        total: stats.contracts.total,
        pending: stats.contracts.byStatus['معلقة'] || 0,
        inReview: stats.contracts.byStatus['قيد المراجعة'] || 0,
        completed: stats.contracts.byStatus['مكتملة'] || 0,
        signed: stats.contracts.signed
      },
      otherServices: {
        total: stats.otherServices.total,
        pending: stats.otherServices.byStatus['معلقة'] || 0,
        completed: stats.otherServices.byStatus['مكتملة'] || 0,
        responded: stats.otherServices.responded
      }
    };
  }
}
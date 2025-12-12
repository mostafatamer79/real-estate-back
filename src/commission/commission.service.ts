// src/commission/commission.service.ts
import { 
    Injectable, 
    NotFoundException, 
    ForbiddenException,
    BadRequestException 
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { Commission, CommissionStatus, CommissionType } from './commission.entity';
  import { CreateCommissionDto,UpdateCommissionDto } from './create-commission.dto';
  import { User, Role } from '../user/user-entity';
  
  @Injectable()
  export class CommissionService {
    constructor(
      @InjectRepository(Commission)
      private readonly commissionRepository: Repository<Commission>,
    ) {}
  
    async create(createDto: CreateCommissionDto, user: User): Promise<Commission> {
      // Only agents can create commissions
      if (user.role !== Role.AGENT) {
        throw new ForbiddenException('Only agents can create commission requests');
      }
  
      const commission = this.commissionRepository.create({
        ...createDto,
        creatorId: user.id,
        status: CommissionStatus.DRAFT,
      });
  
      return await this.commissionRepository.save(commission);
    }
  
    async findAll(user: User, filters?: {
      status?: CommissionStatus;
      type?: CommissionType;
      search?: string;
      startDate?: Date;
      endDate?: Date;
    }): Promise<Commission[]> {
      let query = this.commissionRepository.createQueryBuilder('commission')
        .leftJoinAndSelect('commission.creator', 'creator')
        .leftJoinAndSelect('commission.reviewedBy', 'reviewedBy')
        .orderBy('commission.createdAt', 'DESC');
  
      // Apply user-specific filters
      if (user.role === Role.AGENT) {
        query = query.where('commission.creatorId = :userId', { userId: user.id });
      } else if (user.role === Role.USER) {
        // Users can see commissions where they are mentioned as owner or buyer
        query = query.where(`
          (commission.owner->>'idNumber' = :userId OR 
           commission.buyer->>'idNumber' = :userId)
        `, { userId: user.id });
      }
  
      // Apply additional filters
      if (filters?.status) {
        query = query.andWhere('commission.status = :status', { status: filters.status });
      }
  
      if (filters?.type) {
        query = query.andWhere('commission.type = :type', { type: filters.type });
      }
  
      if (filters?.search) {
        query = query.andWhere(`
          commission.commissionNumber LIKE :search OR
          commission.propertyType LIKE :search OR
          commission.city LIKE :search OR
          commission.neighborhood LIKE :search
        `, { search: `%${filters.search}%` });
      }
  
      if (filters?.startDate) {
        query = query.andWhere('commission.createdAt >= :startDate', { startDate: filters.startDate });
      }
  
      if (filters?.endDate) {
        query = query.andWhere('commission.createdAt <= :endDate', { endDate: filters.endDate });
      }
  
      return await query.getMany();
    }
  
    async findOne(id: string, user: User): Promise<Commission> {
      const commission = await this.commissionRepository.findOne({
        where: { id },
        relations: ['creator', 'reviewedBy']
      });
  
      if (!commission) {
        throw new NotFoundException('Commission request not found');
      }
  
      // Check permissions
      this.checkPermissions(commission, user);
  
      return commission;
    }
  
    async update(id: string, updateDto: UpdateCommissionDto, user: User): Promise<Commission> {
      const commission = await this.findOne(id, user);
  
      // Only creator can update draft commissions
      if (commission.status !== CommissionStatus.DRAFT && user.role === Role.AGENT) {
        throw new ForbiddenException('Only draft commissions can be updated');
      }
  
      // Only admins can change status and final amounts
      if ((updateDto.status || updateDto.finalCommissionAmount) && user.role !== Role.ADMIN) {
        throw new ForbiddenException('Only admins can update commission status and amounts');
      }
  
      // Update status timestamps
      if (updateDto.status) {
        if (updateDto.status === CommissionStatus.PENDING && !commission.submittedAt) {
          commission.submittedAt = new Date();
        } else if (updateDto.status === CommissionStatus.APPROVED && !commission.approvedAt) {
          commission.approvedAt = new Date();
          commission.reviewedById = user.id;
          commission.reviewedAt = new Date();
        } else if (updateDto.status === CommissionStatus.REJECTED) {
          commission.reviewedById = user.id;
          commission.reviewedAt = new Date();
        } else if (updateDto.status === CommissionStatus.PAID && !commission.paidAt) {
          commission.paidAt = new Date();
        }
      }
  
      Object.assign(commission, updateDto);
      return await this.commissionRepository.save(commission);
    }
  
    async submit(id: string, user: User): Promise<Commission> {
      const commission = await this.findOne(id, user);
  
      if (commission.creatorId !== user.id) {
        throw new ForbiddenException('Only the creator can submit the commission');
      }
  
      if (commission.status !== CommissionStatus.DRAFT) {
        throw new BadRequestException('Commission has already been submitted');
      }
  
      commission.status = CommissionStatus.PENDING;
      commission.submittedAt = new Date();
  
      return await this.commissionRepository.save(commission);
    }
  
    async delete(id: string, user: User): Promise<void> {
      const commission = await this.findOne(id, user);
  
      // Only creator can delete draft commissions
      if (commission.creatorId !== user.id || commission.status !== CommissionStatus.DRAFT) {
        throw new ForbiddenException('Only draft commissions can be deleted by their creator');
      }
  
      await this.commissionRepository.remove(commission);
    }
  
    async getStatistics(user: User) {
      const query = this.commissionRepository.createQueryBuilder('commission')
        .select([
          'commission.status as status',
          'COUNT(commission.id) as count',
          'SUM(commission.finalCommissionAmount) as totalAmount',
          'SUM(commission.commissionAmount) as estimatedAmount'
        ]);
  
      if (user.role === Role.AGENT) {
        query.where('commission.creatorId = :userId', { userId: user.id });
      }
  
      const stats = await query
        .groupBy('commission.status')
        .getRawMany();
  
      const total = await this.commissionRepository.count({
        where: user.role === Role.AGENT ? { creatorId: user.id } : {}
      });
  
      const totalCommission = await this.commissionRepository
        .createQueryBuilder('commission')
        .select('SUM(commission.finalCommissionAmount)', 'total')
        .where(user.role === Role.AGENT ? 'commission.creatorId = :userId' : '1=1', { userId: user.id })
        .andWhere('commission.status = :status', { status: CommissionStatus.PAID })
        .getRawOne();
  
      return {
        total,
        paidTotal: parseFloat(totalCommission?.total || '0'),
        byStatus: stats,
      };
    }
  
    async addAttachment(id: string, fileUrl: string, user: User): Promise<Commission> {
      const commission = await this.findOne(id, user);
  
      if (!commission.attachments) {
        commission.attachments = [];
      }
  
      commission.attachments.push(fileUrl);
      return await this.commissionRepository.save(commission);
    }
  
    private checkPermissions(commission: Commission, user: User): void {
      if (user.role === Role.ADMIN) return;
  
      if (user.role === Role.AGENT && commission.creatorId === user.id) return;
  
      if (user.role === Role.USER) {
        const userMatches = 
          commission.owner.idNumber === user.id ||
          commission.buyer.idNumber === user.id;
  
        if (userMatches) return;
      }
  
      throw new ForbiddenException('You do not have permission to access this commission');
    }
  }
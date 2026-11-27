import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MarketingRequest, MarketingRequestType, MarketingRequestStatus } from './entities/marketing-request.entity';
import { PhotographerProfile, PhotographerType } from './entities/photographer-profile.entity';
import { MarketingCampaign } from './entities/marketing-campaign.entity';
import {
  EmailMarketing,
  EmailMarketingApprovalStatus,
  MarketingFrequency,
  MarketingScheduleMode,
} from './entities/email-marketing.entity';
import { CreateMarketingRequestDto, UpdateMarketingRequestDto } from './dto/marketing-request.dto';
import { CreateEmailMarketingDto, UpdateEmailMarketingDto } from './dto/email-marketing.dto';
import { Invoice, InvoiceStatus } from '../financial/entities/invoice.entity';
import { EMAIL_MARKETING_INVOICE_REFERENCE_TYPE } from './publish-paid-ad';

import { MailService } from '../mail/mail.service';

import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/notification.entity';
import { User, Role } from '../user/user-entity';

@Injectable()
export class MarketingService {
  constructor(
    @InjectRepository(MarketingRequest)
    private marketingRequestRepository: Repository<MarketingRequest>,
    @InjectRepository(PhotographerProfile)
    private photographerRepository: Repository<PhotographerProfile>,
    @InjectRepository(MarketingCampaign)
    private campaignRepository: Repository<MarketingCampaign>,
    @InjectRepository(EmailMarketing)
    private emailMarketingRepository: Repository<EmailMarketing>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    private mailService: MailService,
    private notificationService: NotificationService,
  ) {}

  async create(createDto: CreateMarketingRequestDto, userId: string): Promise<MarketingRequest> {
    const request = this.marketingRequestRepository.create({
      ...createDto,
      clientId: userId,
      status: MarketingRequestStatus.PENDING,
    });

    // Auto-assignment for photography requests
    if (request.type === MarketingRequestType.PHOTOGRAPHY_PROFESSIONAL ||
        request.type === MarketingRequestType.PHOTOGRAPHY_FIELD) {
      const assignedPhotographer = await this.autoAssignPhotographer(request.type);
      if (assignedPhotographer) {
        request.assignedTo = assignedPhotographer.user.id;
        request.status = MarketingRequestStatus.IN_PROGRESS;
      }
    }

    const savedRequest = await this.marketingRequestRepository.save(request);

    // Notifications (Email)
    // await this.mailService.sendMarketingRequestNotification(
    //   'admin@example.com',
    //   savedRequest.type,
    //   savedRequest.id
    // );

    // Notifications (In-app)
    await this.notificationService.create(
      'admin-uuid', // Placeholder for admin ID, you should fetch actual admin IDs
      NotificationType.MARKETING,
      'طلب تسويق جديد',
      `تم استلام طلب جديد: ${savedRequest.type}`,
      { requestId: savedRequest.id }
    );

    if (savedRequest.assignedTo) {
      await this.notificationService.create(
        savedRequest.assignedTo,
        NotificationType.MARKETING,
        'تم تعيين طلب جديد لك',
        `لديك طلب تصوير جديد جاهز للبدء`,
        { requestId: savedRequest.id }
      );
    }

    return savedRequest;
  }

  private async autoAssignPhotographer(type: MarketingRequestType): Promise<PhotographerProfile | null> {
    const profileType = type === MarketingRequestType.PHOTOGRAPHY_PROFESSIONAL
      ? PhotographerType.COMPANY
      : PhotographerType.INDIVIDUAL;

    // Simple priority-based auto-assignment:
    // Find verified photographers of the correct type, ordered by least completed jobs (to load balance)
    const photographers = await this.photographerRepository.find({
      where: { type: profileType, isVerified: true },
      order: { completedJobs: 'ASC' },
      relations: ['user'],
    });

    return photographers.length > 0 ? photographers[0] : null;
  }

  async findAll(): Promise<MarketingRequest[]> {
    return this.marketingRequestRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findByClient(clientId: string): Promise<MarketingRequest[]> {
    return this.marketingRequestRepository.find({ where: { clientId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<MarketingRequest> {
    const request = await this.marketingRequestRepository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Marketing request with ID ${id} not found`);
    }
    return request;
  }

  async update(id: string, updateDto: UpdateMarketingRequestDto): Promise<MarketingRequest> {
    const request = await this.findOne(id);
    Object.assign(request, updateDto);
    return this.marketingRequestRepository.save(request);
  }

  async remove(id: string): Promise<void> {
    const request = await this.findOne(id);
    await this.marketingRequestRepository.remove(request);
  }

  // Campaign Analytics
  async getCampaignAnalytics(campaignId: string) {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
      relations: ['request']
    });

    if (!campaign) throw new NotFoundException('Campaign not found');

    // In a real scenario, this would fetch from a social media API
    // For now, we provide enhanced simulation data for the optimized UI
    return {
      ...campaign,
      performance: {
        dailyReach: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reach: Math.floor(Math.random() * 5000) + 1000,
          clicks: Math.floor(Math.random() * 200) + 20,
        })),
        conversionRate: (Math.random() * 5 + 1).toFixed(2) + '%',
        cpc: (Math.random() * 2 + 0.5).toFixed(2),
        totalSpend: campaign.analyticsData?.budget || 0,
      }
    };
  }

  async updateCampaignStats(campaignId: string, stats: Partial<MarketingCampaign>): Promise<MarketingCampaign> {
    const campaign = await this.campaignRepository.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    Object.assign(campaign, stats);
    return this.campaignRepository.save(campaign);
  }

  async getCampaignsByRequest(requestId: string): Promise<MarketingCampaign[]> {
    return this.campaignRepository.find({
      where: { request: { id: requestId } },
      order: { createdAt: 'DESC' }
    });
  }

  // Photographer Profile Management
  async createPhotographerProfile(profileData: Partial<PhotographerProfile>): Promise<PhotographerProfile> {
    const profile = this.photographerRepository.create(profileData);
    return this.photographerRepository.save(profile);
  }

  async getPhotographerProfile(userId: string): Promise<PhotographerProfile | null> {
    return this.photographerRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user']
    });
  }

  private pickWhitelistedEmailMarketingContent(dto: Partial<CreateEmailMarketingDto & UpdateEmailMarketingDto>) {
    const content: Record<string, unknown> = {};
    if (dto.category !== undefined) content.category = String(dto.category).toLowerCase();
    if (dto.subject !== undefined) content.subject = dto.subject;
    if (dto.linkedResourceType !== undefined) content.linkedResourceType = dto.linkedResourceType;
    if (dto.linkedResourceId !== undefined) content.linkedResourceId = dto.linkedResourceId;
    if (dto.assignedTo !== undefined) content.assignedTo = dto.assignedTo || null;
    if (dto.content !== undefined) content.content = dto.content;
    if (dto.sortOrder !== undefined) content.sortOrder = Number(dto.sortOrder) || 0;
    if (dto.scheduleMode !== undefined) content.scheduleMode = dto.scheduleMode || MarketingScheduleMode.MANUAL;
    if (dto.startDate !== undefined) content.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) content.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.frequency !== undefined) content.frequency = String(dto.frequency).toLowerCase();
    if (dto.targetRole !== undefined) content.targetRole = dto.targetRole ? String(dto.targetRole).toLowerCase() : null;
    if (dto.propertyType !== undefined) content.propertyType = dto.propertyType;
    if (dto.mainCategory !== undefined) content.mainCategory = dto.mainCategory;
    if (dto.dealType !== undefined) content.dealType = dto.dealType;
    if (dto.price !== undefined) content.price = Number(dto.price) || 0;
    if (dto.area !== undefined) content.area = Number(dto.area) || 0;
    if (dto.city !== undefined) content.city = dto.city;
    if (dto.neighborhood !== undefined) content.neighborhood = dto.neighborhood;
    if (dto.mediaFiles !== undefined) content.mediaFiles = Array.isArray(dto.mediaFiles) ? dto.mediaFiles : [];
    if (dto.details !== undefined) content.details = dto.details;
    return content;
  }

  private parsePublicationFee(rawFee: unknown): number {
    if (typeof rawFee !== 'number' || !Number.isFinite(rawFee) || rawFee <= 0 || rawFee > 9999999999) {
      throw new BadRequestException('Publication fee must be a positive number up to 9999999999');
    }
    if (Math.abs(rawFee * 100 - Math.round(rawFee * 100)) >= 1e-6) {
      throw new BadRequestException('Publication fee must have at most 2 decimal places');
    }
    return Number(rawFee.toFixed(2));
  }

  private async decorateCampaignsWithInvoices(campaigns: EmailMarketing[]): Promise<EmailMarketing[]> {
    if (!campaigns.length || !this.invoiceRepository) return campaigns;
    const invoiceIds = [...new Set(campaigns.map((c) => c.invoiceId).filter((id): id is string => Boolean(id)))];
    if (!invoiceIds.length) return campaigns;
    const invoices = await this.invoiceRepository.find({ where: { id: In(invoiceIds) } });
    const byId = new Map(invoices.map((inv) => [inv.id, inv]));
    return campaigns.map((campaign) => {
      const inv = campaign.invoiceId ? byId.get(campaign.invoiceId) : undefined;
      if (!inv) return campaign;
      return Object.assign(campaign, {
        invoice: {
          id: inv.id,
          status: inv.status,
          amount: inv.amount,
          total: inv.total,
          description: inv.description,
          createdAt: inv.createdAt,
        },
      });
    });
  }

  // Email Marketing Management
  async createEmailMarketing(createDto: CreateEmailMarketingDto, ownerId: string): Promise<EmailMarketing> {
    const whitelisted = this.pickWhitelistedEmailMarketingContent(createDto || {});
    const normalized = {
      ...whitelisted,
      sortOrder: Number(whitelisted.sortOrder ?? 0),
      scheduleMode: (whitelisted.scheduleMode as MarketingScheduleMode) || MarketingScheduleMode.MANUAL,
      isActive: false,
      approvalStatus: EmailMarketingApprovalStatus.PENDING,
      publicationFee: null,
      invoiceId: null,
      ownerId,
    };
    const campaign = this.emailMarketingRepository.create(normalized as Partial<EmailMarketing>);
    return await this.emailMarketingRepository.save(campaign);
  }

  async updateEmailMarketing(id: string, ownerId: string, updateDto: UpdateEmailMarketingDto & { approvalStatus?: unknown; publicationFee?: unknown; invoiceId?: unknown; ownerId?: unknown }, userRole?: string): Promise<EmailMarketing> {
    return this.emailMarketingRepository.manager.transaction(async (manager) => {
      const isAdmin = userRole === Role.ADMIN;
      const repository = manager.getRepository(EmailMarketing);
      const query = repository.createQueryBuilder('campaign').setLock('pessimistic_write')
        .where('campaign.id = :id', { id });
      if (!isAdmin) {
        query.andWhere('campaign.ownerId = :ownerId', { ownerId });
      }
      const campaign = await query.getOne();
      if (!campaign) throw new NotFoundException('Marketing campaign not found');

      if (
        updateDto?.approvalStatus !== undefined ||
        updateDto?.publicationFee !== undefined ||
        updateDto?.invoiceId !== undefined ||
        updateDto?.ownerId !== undefined
      ) {
        throw new BadRequestException('Approval, fee, owner, and invoice fields cannot be modified via update');
      }

      if (!isAdmin) {
        if (updateDto?.isActive !== undefined && updateDto.isActive !== campaign.isActive) {
          throw new ForbiddenException('Only admins can toggle ad activation after payment');
        }
        if (![EmailMarketingApprovalStatus.PENDING, EmailMarketingApprovalStatus.REJECTED].includes(campaign.approvalStatus)) {
          throw new ForbiddenException('Cannot edit ad content after pricing or approval; contact admin to reset');
        }
        const whitelisted = this.pickWhitelistedEmailMarketingContent(updateDto || {});
        Object.assign(campaign, whitelisted);
        if (campaign.approvalStatus === EmailMarketingApprovalStatus.REJECTED) {
          campaign.approvalStatus = EmailMarketingApprovalStatus.PENDING;
        }
        campaign.isActive = false;
        return repository.save(campaign);
      }

      if (updateDto?.isActive !== undefined) {
        const nextActive = Boolean(updateDto.isActive);
        if (nextActive) {
          if (campaign.approvalStatus !== EmailMarketingApprovalStatus.PUBLISHED || !campaign.invoiceId) {
            throw new BadRequestException('Cannot activate ad before approval and paid invoice');
          }
          const invoice = await this.invoiceRepository.findOne({ where: { id: campaign.invoiceId } });
          const fee = Number(campaign.publicationFee);
          const invTotal = Number(invoice?.total);
          const validPaidInvoice = Boolean(
            invoice &&
            invoice.status === InvoiceStatus.PAID &&
            invoice.referenceType === EMAIL_MARKETING_INVOICE_REFERENCE_TYPE &&
            invoice.referenceId === campaign.id &&
            invoice.userId === campaign.ownerId &&
            Number.isFinite(fee) &&
            fee > 0 &&
            Math.round(invTotal * 100) === Math.round(fee * 100),
          );
          if (!validPaidInvoice) {
            throw new BadRequestException('Cannot activate ad without a paid matching invoice');
          }
        }
        campaign.isActive = nextActive;
      }

      const whitelisted = this.pickWhitelistedEmailMarketingContent(updateDto || {});
      Object.assign(campaign, whitelisted);
      return repository.save(campaign);
    });
  }

  async approveEmailMarketing(id: string, rawPublicationFee: number): Promise<{ campaign: EmailMarketing; invoice: Invoice }> {
    const fee = this.parsePublicationFee(rawPublicationFee);

    return this.emailMarketingRepository.manager.transaction(async (manager) => {
      // Lock invoices first, then campaign (consistent invoice -> campaign lock order).
      const existingInvoices = await manager.find(Invoice, {
        where: { referenceType: EMAIL_MARKETING_INVOICE_REFERENCE_TYPE, referenceId: id },
        lock: { mode: 'pessimistic_write' },
      });

      const campaign = await manager.findOne(EmailMarketing, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!campaign) {
        throw new NotFoundException('Marketing campaign not found');
      }
      if (!campaign.ownerId) {
        throw new BadRequestException('Campaign has no owner to bill');
      }
      if (campaign.invoiceId && !existingInvoices.some(invoice => invoice.id === campaign.invoiceId)) {
        throw new ConflictException('Ad pricing changed concurrently; retry approval');
      }
      if (campaign.approvalStatus === EmailMarketingApprovalStatus.PUBLISHED) {
        throw new BadRequestException('Cannot reprice an already published ad');
      }
      if (existingInvoices.some((inv) => inv.status === InvoiceStatus.PAID)) {
        throw new BadRequestException('Cannot reprice an ad with a paid invoice');
      }

      const currentUnpaid = campaign.invoiceId
        ? existingInvoices.find((inv) => inv.id === campaign.invoiceId && inv.status === InvoiceStatus.UNPAID)
        : undefined;

      if (
        campaign.approvalStatus === EmailMarketingApprovalStatus.AWAITING_PAYMENT &&
        currentUnpaid &&
        currentUnpaid.userId === campaign.ownerId &&
        Math.round(Number(currentUnpaid.total) * 100) === Math.round(fee * 100)
      ) {
        if (campaign.isActive || Math.round(Number(campaign.publicationFee || 0) * 100) !== Math.round(fee * 100)) {
          campaign.isActive = false;
          campaign.publicationFee = fee;
          await manager.save(EmailMarketing, campaign);
        }
        return { campaign, invoice: currentUnpaid };
      }

      for (const inv of existingInvoices) {
        if (inv.status === InvoiceStatus.UNPAID) {
          inv.status = InvoiceStatus.CANCELLED;
          await manager.save(Invoice, inv);
        }
      }

      const newInvoice = manager.create(Invoice, {
        userId: campaign.ownerId,
        amount: fee,
        serviceFee: 0,
        tax: 0,
        total: fee,
        status: InvoiceStatus.UNPAID,
        referenceType: EMAIL_MARKETING_INVOICE_REFERENCE_TYPE,
        referenceId: campaign.id,
        description: `فاتورة نشر إعلان: ${campaign.subject || campaign.id.slice(0, 8)}`,
      });
      const savedInvoice = await manager.save(Invoice, newInvoice);

      campaign.approvalStatus = EmailMarketingApprovalStatus.AWAITING_PAYMENT;
      campaign.publicationFee = fee;
      campaign.invoiceId = savedInvoice.id;
      campaign.isActive = false;
      const savedCampaign = await manager.save(EmailMarketing, campaign);

      return { campaign: savedCampaign, invoice: savedInvoice };
    });
  }

  async rejectEmailMarketing(id: string, reason?: string): Promise<EmailMarketing> {
    return this.emailMarketingRepository.manager.transaction(async (manager) => {
      const existingInvoices = await manager.find(Invoice, {
        where: { referenceType: EMAIL_MARKETING_INVOICE_REFERENCE_TYPE, referenceId: id },
        lock: { mode: 'pessimistic_write' },
      });

      const campaign = await manager.findOne(EmailMarketing, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!campaign) {
        throw new NotFoundException('Marketing campaign not found');
      }
      if (
        campaign.approvalStatus === EmailMarketingApprovalStatus.PUBLISHED ||
        existingInvoices.some((inv) => inv.status === InvoiceStatus.PAID)
      ) {
        throw new BadRequestException('Cannot reject an already published or paid ad');
      }

      for (const inv of existingInvoices) {
        if (inv.status === InvoiceStatus.UNPAID) {
          inv.status = InvoiceStatus.CANCELLED;
          await manager.save(Invoice, inv);
        }
      }

      campaign.approvalStatus = EmailMarketingApprovalStatus.REJECTED;
      campaign.isActive = false;
      campaign.publicationFee = null;
      campaign.invoiceId = null;
      if (reason?.trim()) {
        campaign.details = { ...((campaign.details || {}) as Record<string, unknown>), rejectionReason: reason.trim() };
      }
      return manager.save(EmailMarketing, campaign);
    });
  }

  async findEmailMarketingByOwner(ownerId: string, userRole?: string): Promise<EmailMarketing[]> {
    const campaigns = userRole === Role.ADMIN
      ? await this.emailMarketingRepository.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' } })
      : await this.emailMarketingRepository.find({ where: { ownerId }, order: { sortOrder: 'ASC', createdAt: 'DESC' } });
    return this.decorateCampaignsWithInvoices(campaigns);
  }

  async findPublicEmailMarketing(): Promise<EmailMarketing[]> {
    const now = new Date();
    return this.emailMarketingRepository
      .createQueryBuilder('campaign')
      .innerJoin(
        Invoice,
        'inv',
        'inv.id = campaign.invoiceId AND inv.referenceType = :refType AND inv.referenceId = CAST(campaign.id AS text) AND inv.userId = campaign.ownerId AND inv.status = :paidStatus AND ROUND(inv.total, 2) = ROUND(campaign.publicationFee, 2)',
        {
          refType: EMAIL_MARKETING_INVOICE_REFERENCE_TYPE,
          paidStatus: InvoiceStatus.PAID,
        },
      )
      .where('campaign.isActive = :isActive', { isActive: true })
      .andWhere('campaign.approvalStatus = :published', { published: EmailMarketingApprovalStatus.PUBLISHED })
      .andWhere('campaign.invoiceId IS NOT NULL')
      .andWhere('campaign.publicationFee IS NOT NULL AND campaign.publicationFee > 0')
      .andWhere(
        '(campaign.scheduleMode = :manual OR (campaign.scheduleMode = :range AND (campaign.startDate IS NULL OR campaign.startDate <= :now) AND (campaign.endDate IS NULL OR campaign.endDate >= :now)))',
        { manual: MarketingScheduleMode.MANUAL, range: MarketingScheduleMode.DATE_RANGE, now },
      )
      .orderBy('campaign.sortOrder', 'ASC')
      .addOrderBy('campaign.createdAt', 'DESC')
      .getMany();
  }

  async getEmailMarketingById(id: string, ownerId: string, userRole?: string): Promise<EmailMarketing> {
    const query = this.emailMarketingRepository.createQueryBuilder('campaign')
      .where('campaign.id = :id', { id });
    if (userRole !== Role.ADMIN) {
      query.andWhere('campaign.ownerId = :ownerId', { ownerId });
    }
    const campaign = await query.getOne();
    if (!campaign) throw new NotFoundException('Marketing campaign not found');
    const [decorated] = await this.decorateCampaignsWithInvoices([campaign]);
    return decorated;
  }

  async assertCanUploadMedia(id: string, ownerId: string, userRole?: string): Promise<EmailMarketing> {
    const campaign = await this.getEmailMarketingById(id, ownerId, userRole);
    if (
      userRole !== Role.ADMIN &&
      ![EmailMarketingApprovalStatus.PENDING, EmailMarketingApprovalStatus.REJECTED].includes(campaign.approvalStatus)
    ) {
      throw new ForbiddenException('Cannot modify ad media after pricing or approval');
    }
    return campaign;
  }

  async addMedia(id: string, files: string[], ownerId: string, userRole?: string): Promise<EmailMarketing> {
    return this.emailMarketingRepository.manager.transaction(async manager => {
      const campaign = await manager.findOne(EmailMarketing, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!campaign || (userRole !== Role.ADMIN && campaign.ownerId !== ownerId)) throw new NotFoundException('Marketing campaign not found');
      if (userRole !== Role.ADMIN && ![EmailMarketingApprovalStatus.PENDING, EmailMarketingApprovalStatus.REJECTED].includes(campaign.approvalStatus)) {
        throw new ForbiddenException('Cannot modify ad media after pricing or approval');
      }
      campaign.mediaFiles = [...(campaign.mediaFiles || []), ...files];
      return manager.save(EmailMarketing, campaign);
    });
  }

  async removeEmailMarketing(id: string, ownerId: string, userRole?: string): Promise<void> {
    const campaign = await this.getEmailMarketingById(id, ownerId, userRole);
    await this.emailMarketingRepository.remove(campaign);
  }

  async getEmailMarketingStats(ownerId: string) {
    const campaigns = await this.emailMarketingRepository.find({ where: { ownerId } });
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const currentStart = now - thirtyDays;
    const previousStart = now - thirtyDays * 2;

    const summarize = (items: EmailMarketing[]) => {
      const totalSent = items.reduce((sum, campaign) => sum + Number(campaign.totalSent || 0), 0);
      const openCount = items.reduce((sum, campaign) => sum + Number(campaign.openCount || 0), 0);
      const clickCount = items.reduce((sum, campaign) => sum + Number(campaign.clickCount || 0), 0);

      return {
        totalSent,
        openRate: totalSent > 0 ? (openCount / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (clickCount / totalSent) * 100 : 0,
      };
    };

    const current = summarize(campaigns.filter((campaign) => new Date(campaign.createdAt).getTime() >= currentStart));
    const previous = summarize(campaigns.filter((campaign) => {
      const createdAt = new Date(campaign.createdAt).getTime();
      return createdAt >= previousStart && createdAt < currentStart;
    }));
    const allTime = summarize(campaigns);
    const delta = (currentValue: number, previousValue: number) => {
      if (previousValue === 0) return currentValue === 0 ? 0 : 100;
      return ((currentValue - previousValue) / previousValue) * 100;
    };

    return {
      totalSent: allTime.totalSent,
      openRate: allTime.openRate,
      clickRate: allTime.clickRate,
      sentTrend: delta(current.totalSent, previous.totalSent),
      openRateTrend: current.openRate - previous.openRate,
      clickRateTrend: current.clickRate - previous.clickRate,
    };
  }

  async sendScheduledEmails() {
    const campaigns = await this.emailMarketingRepository
      .createQueryBuilder('campaign')
      .innerJoin(
        Invoice,
        'inv',
        'inv.id = campaign.invoiceId AND inv.referenceType = :refType AND inv.referenceId = CAST(campaign.id AS text) AND inv.userId = campaign.ownerId AND inv.status = :paidStatus AND ROUND(inv.total, 2) = ROUND(campaign.publicationFee, 2)',
        {
          refType: EMAIL_MARKETING_INVOICE_REFERENCE_TYPE,
          paidStatus: InvoiceStatus.PAID,
        },
      )
      .where('campaign.isActive = :isActive', { isActive: true })
      .andWhere('campaign.approvalStatus = :published', { published: EmailMarketingApprovalStatus.PUBLISHED })
      .andWhere('campaign.invoiceId IS NOT NULL')
      .andWhere('campaign.publicationFee IS NOT NULL AND campaign.publicationFee > 0')
      .getMany();
    const now = new Date();

    for (const campaign of campaigns) {
      if (campaign.scheduleMode === MarketingScheduleMode.DATE_RANGE) {
        const startOk = !campaign.startDate || new Date(campaign.startDate) <= now;
        const endOk = !campaign.endDate || new Date(campaign.endDate) >= now;
        if (!startOk || !endOk) continue;
      }
      const frequencyDaysMap: Record<string, number> = {
        [MarketingFrequency.DAILY]: 1,
        [MarketingFrequency.EVERY_2_DAYS]: 2,
        [MarketingFrequency.WEEKLY]: 7,
        [MarketingFrequency.BIWEEKLY]: 14,
      };
      const waitDays = frequencyDaysMap[campaign.frequency] ?? 7;
      const lastSent = campaign.lastSentAt ? new Date(campaign.lastSentAt) : new Date(0);
      const waitMs = waitDays * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000; // 2 hours grace period

      if (now.getTime() - lastSent.getTime() >= waitMs) {
        // Find targeted users
        const query = this.userRepository.createQueryBuilder('user');
        if (campaign.targetRole) {
          query.where('user.role = :role', { role: campaign.targetRole });
        }
        const users = await query.getMany();

        // for (const user of users) {
        //   if (user.email) {
        //     await this.mailService.sendMarketingEmail(
        //       user.email,
        //       campaign.subject || `إشعار من الوساطة الرقمية: ${campaign.category}`,
        //       campaign.content,
        //       campaign.category
        //     );
        //   }
        // }

        campaign.lastSentAt = now;
        campaign.totalSent = Number(campaign.totalSent || 0) + users.length;
        await this.emailMarketingRepository.save(campaign);
      }
    }
  }
}

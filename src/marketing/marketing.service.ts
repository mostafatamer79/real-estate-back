import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingRequest, MarketingRequestType, MarketingRequestStatus } from './entities/marketing-request.entity';
import { PhotographerProfile, PhotographerType } from './entities/photographer-profile.entity';
import { MarketingCampaign } from './entities/marketing-campaign.entity';
import { EmailMarketing, MarketingFrequency, MarketingScheduleMode } from './entities/email-marketing.entity';
import { CreateMarketingRequestDto, UpdateMarketingRequestDto } from './dto/marketing-request.dto';
import { CreateEmailMarketingDto, UpdateEmailMarketingDto } from './dto/email-marketing.dto';

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

  // Email Marketing Management
  async createEmailMarketing(createDto: CreateEmailMarketingDto, ownerId: string): Promise<EmailMarketing> {
    // Normalize enum values to lowercase to guard against cached clients sending uppercase
    const normalized = {
      ...createDto,
      category: createDto.category?.toLowerCase() as any,
      frequency: createDto.frequency?.toLowerCase() as any,
      targetRole: createDto.targetRole ? createDto.targetRole.toLowerCase() as any : null,
      sortOrder: Number((createDto as any).sortOrder ?? 0) || 0,
      scheduleMode: (createDto as any).scheduleMode || MarketingScheduleMode.MANUAL,
      startDate: (createDto as any).startDate ? new Date((createDto as any).startDate) : undefined,
      endDate: (createDto as any).endDate ? new Date((createDto as any).endDate) : undefined,
      ownerId,
    };
    const campaign = this.emailMarketingRepository.create(normalized as any) as unknown as EmailMarketing;
    return await this.emailMarketingRepository.save(campaign);
  }

  async updateEmailMarketing(id: string, ownerId: string, updateDto: UpdateEmailMarketingDto, userRole?: string): Promise<EmailMarketing> {
    const query = this.emailMarketingRepository.createQueryBuilder('campaign')
      .where('campaign.id = :id', { id });
    if (userRole !== 'admin') {
      query.andWhere('campaign.ownerId = :ownerId', { ownerId });
    }
    const campaign = await query.getOne();
    if (!campaign) throw new NotFoundException('Marketing campaign not found');
    const normalized: any = {
      ...updateDto,
      ...(updateDto.category && { category: updateDto.category.toLowerCase() }),
      ...(updateDto.frequency && { frequency: updateDto.frequency.toLowerCase() }),
      ...(updateDto.targetRole !== undefined && { targetRole: updateDto.targetRole ? updateDto.targetRole.toLowerCase() : null }),
      ...(updateDto.sortOrder !== undefined && { sortOrder: Number(updateDto.sortOrder) || 0 }),
      ...(updateDto.scheduleMode && { scheduleMode: updateDto.scheduleMode }),
      ...(updateDto.startDate !== undefined && { startDate: updateDto.startDate ? new Date(updateDto.startDate) : null }),
      ...(updateDto.endDate !== undefined && { endDate: updateDto.endDate ? new Date(updateDto.endDate) : null }),
    };
    Object.assign(campaign, normalized);
    return this.emailMarketingRepository.save(campaign);
  }

  async findEmailMarketingByOwner(ownerId: string, userRole?: string): Promise<EmailMarketing[]> {
    if (userRole === 'admin') {
      return this.emailMarketingRepository.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' } });
    }
    return this.emailMarketingRepository.find({ where: { ownerId }, order: { sortOrder: 'ASC', createdAt: 'DESC' } });
  }

  async findPublicEmailMarketing(): Promise<EmailMarketing[]> {
    const now = new Date();
    return this.emailMarketingRepository
      .createQueryBuilder('campaign')
      .where('campaign.isActive = :isActive', { isActive: true })
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
    if (userRole !== 'admin') {
      query.andWhere('campaign.ownerId = :ownerId', { ownerId });
    }
    const campaign = await query.getOne();
    if (!campaign) throw new NotFoundException('Marketing campaign not found');
    return campaign;
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
    const campaigns = await this.emailMarketingRepository.find({ where: { isActive: true } });
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

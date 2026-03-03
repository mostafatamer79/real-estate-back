import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingRequest, MarketingRequestType, MarketingRequestStatus } from './entities/marketing-request.entity';
import { PhotographerProfile, PhotographerType } from './entities/photographer-profile.entity';
import { MarketingCampaign } from './entities/marketing-campaign.entity';
import { EmailMarketing, MarketingFrequency } from './entities/email-marketing.entity';
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
    await this.mailService.sendMarketingRequestNotification(
      'admin@example.com', 
      savedRequest.type, 
      savedRequest.id
    );

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
  async createEmailMarketing(createDto: CreateEmailMarketingDto): Promise<EmailMarketing> {
    // Normalize enum values to lowercase to guard against cached clients sending uppercase
    const normalized = {
      ...createDto,
      category: createDto.category?.toLowerCase() as any,
      frequency: createDto.frequency?.toLowerCase() as any,
      targetRole: createDto.targetRole ? createDto.targetRole.toLowerCase() as any : null,
    };
    const campaign = this.emailMarketingRepository.create(normalized);
    return this.emailMarketingRepository.save(campaign);
  }

  async updateEmailMarketing(id: string, updateDto: UpdateEmailMarketingDto): Promise<EmailMarketing> {
    const campaign = await this.emailMarketingRepository.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Marketing campaign not found');
    const normalized: any = {
      ...updateDto,
      ...(updateDto.category && { category: updateDto.category.toLowerCase() }),
      ...(updateDto.frequency && { frequency: updateDto.frequency.toLowerCase() }),
      ...(updateDto.targetRole !== undefined && { targetRole: updateDto.targetRole ? updateDto.targetRole.toLowerCase() : null }),
    };
    Object.assign(campaign, normalized);
    return this.emailMarketingRepository.save(campaign);
  }

  async findAllEmailMarketing(): Promise<EmailMarketing[]> {
    return this.emailMarketingRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getEmailMarketingById(id: string): Promise<EmailMarketing> {
    const campaign = await this.emailMarketingRepository.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Marketing campaign not found');
    return campaign;
  }

  async removeEmailMarketing(id: string): Promise<void> {
    const campaign = await this.emailMarketingRepository.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Marketing campaign not found');
    await this.emailMarketingRepository.remove(campaign);
  }

  async sendScheduledEmails() {
    const campaigns = await this.emailMarketingRepository.find({ where: { isActive: true } });
    const now = new Date();

    for (const campaign of campaigns) {
      const frequencyDaysMap: Record<string, number> = {
        [MarketingFrequency.DAILY]: 1,
        [MarketingFrequency.EVERY_2_DAYS]: 2,
        [MarketingFrequency.WEEKLY]: 7,
        [MarketingFrequency.BIWEEKLY]: 14,
      };
      const waitDays = frequencyDaysMap[campaign.frequency] ?? 7;
      const lastSent = campaign.lastSentAt ? new Date(campaign.lastSentAt) : new Date(0);
      const diffDays = Math.floor((now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= waitDays) {
        // Find targeted users
        const query = this.userRepository.createQueryBuilder('user');
        if (campaign.targetRole) {
          query.where('user.role = :role', { role: campaign.targetRole });
        }
        const users = await query.getMany();

        for (const user of users) {
          if (user.email) {
            await this.mailService.sendMarketingEmail(
              user.email, 
              campaign.subject || `إشعار من دير عقارك: ${campaign.category}`, 
              campaign.content,
              campaign.category
            );
          }
        }

        campaign.lastSentAt = now;
        await this.emailMarketingRepository.save(campaign);
      }
    }
  }
}

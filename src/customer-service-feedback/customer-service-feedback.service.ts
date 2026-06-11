import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CustomerServiceFeedback,
  CustomerServiceFeedbackStatus,
} from './entities/customer-service-feedback.entity';
import { CreateCustomerServiceFeedbackDto } from './dto/create-customer-service-feedback.dto';
import { UpdateCustomerServiceFeedbackDto } from './dto/update-customer-service-feedback.dto';
import { Role, User } from '../user/user-entity';
import { MailService } from '../mail/mail.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationType } from '../notification/notification.entity';

@Injectable()
export class CustomerServiceFeedbackService {
  constructor(
    @InjectRepository(CustomerServiceFeedback)
    private readonly repo: Repository<CustomerServiceFeedback>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  private async notifyUser(userId: string | null | undefined, title: string, message: string, data: Record<string, any>) {
    if (!userId) return;
    const notification = await this.notificationService.create(userId, NotificationType.SYSTEM, title, message, data);
    await this.notificationGateway.sendNotificationToUser(userId, notification);
  }

  private async notifyAdmins(title: string, message: string, data: Record<string, any>) {
    const admins = await this.userRepo.find({
      where: { role: Role.ADMIN } as any,
      select: ['id'] as any,
    });

    await Promise.all(
      admins.map(async (admin) => {
        const notification = await this.notificationService.create(admin.id, NotificationType.SYSTEM, title, message, data);
        await this.notificationGateway.sendNotificationToUser(admin.id, notification);
      }),
    );
  }

  private async findTicketUser(item: CustomerServiceFeedback): Promise<User | null> {
    if (item.userId) {
      const user = await this.userRepo.findOne({ where: { id: item.userId } });
      if (user) return user;
    }
    if (item.email) {
      const user = await this.userRepo.findOne({ where: { email: item.email.toLowerCase() } });
      if (user) return user;
    }
    if (item.phoneNumber) {
      return this.userRepo.findOne({ where: { phone: item.phoneNumber } });
    }
    return null;
  }

  findAll(): Promise<CustomerServiceFeedback[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findMine(user: any): Promise<CustomerServiceFeedback[]> {
    const userId = user?.id || user?.userId;
    const email = user?.email || null;
    const phone = user?.phone || null;

    if (!userId && !email && !phone) return [];

    const query = this.repo.createQueryBuilder('feedback');
    const clauses: string[] = [];
    const params: Record<string, string> = {};

    if (userId) {
      clauses.push('feedback.userId = :userId');
      params.userId = userId;
    }
    if (email) {
      clauses.push('LOWER(feedback.email) = LOWER(:email)');
      params.email = email;
    }
    if (phone) {
      clauses.push('feedback.phoneNumber = :phone');
      params.phone = phone;
    }

    return query
      .where(clauses.join(' OR '), params)
      .orderBy('feedback.createdAt', 'DESC')
      .getMany();
  }

  async create(dto: CreateCustomerServiceFeedbackDto, userId?: string | null): Promise<CustomerServiceFeedback> {
    const item = this.repo.create({
      name: dto.name,
      contactMethod: dto.contactMethod,
      email: dto.email ?? null,
      phoneNumber: dto.phoneNumber ?? null,
      question: dto.question,
      pagePath: dto.pagePath ?? null,
      userId: userId ?? null,
      status: CustomerServiceFeedbackStatus.NEW,
    });
    const saved = await this.repo.save(item);
    await this.notifyAdmins(
      'تذكرة خدمة عملاء جديدة',
      `${saved.name} أرسل تذكرة جديدة`,
      { ticketId: saved.id, type: 'customer_service_ticket', action: 'created' },
    );
    return saved;
  }

  async update(id: string, dto: UpdateCustomerServiceFeedbackDto): Promise<CustomerServiceFeedback> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Feedback not found');
    item.status = dto.status;
    return this.repo.save(item);
  }

  async replyAsAdmin(id: string, reply: string, adminId?: string | null): Promise<CustomerServiceFeedback> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Feedback not found');

    item.adminReply = reply;
    item.adminRepliedAt = new Date();
    item.adminRepliedById = adminId ?? null;
    item.status = CustomerServiceFeedbackStatus.REPLIED;
    const saved = await this.repo.save(item);

    const user = item.userId ? await this.userRepo.findOne({ where: { id: item.userId } }) : null;
    const ticketUser = user || await this.findTicketUser(item);
    const email = item.email || ticketUser?.email || null;
    if (email) {
      await this.mailService.sendCustomerServiceReply(email, saved, reply);
    }
    await this.notifyUser(
      ticketUser?.id,
      'تم الرد على تذكرتك',
      'ردت الإدارة على تذكرة خدمة العملاء الخاصة بك',
      { ticketId: saved.id, type: 'customer_service_ticket', action: 'admin_reply' },
    );

    return saved;
  }

  async replyAsUser(id: string, reply: string, user: any): Promise<CustomerServiceFeedback> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Feedback not found');

    const userId = user?.id || user?.userId;
    const email = user?.email || null;
    const phone = user?.phone || null;
    const ownsTicket =
      (userId && item.userId === userId) ||
      (email && item.email?.toLowerCase() === String(email).toLowerCase()) ||
      (phone && item.phoneNumber === phone);

    if (!ownsTicket) throw new NotFoundException('Feedback not found');

    item.userReply = reply;
    item.userRepliedAt = new Date();
    item.status = CustomerServiceFeedbackStatus.CUSTOMER_REPLIED;
    const saved = await this.repo.save(item);
    await this.notifyAdmins(
      'رد جديد من العميل',
      `${saved.name} رد على تذكرة خدمة العملاء`,
      { ticketId: saved.id, type: 'customer_service_ticket', action: 'customer_reply' },
    );
    return saved;
  }

  async remove(id: string): Promise<void> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Feedback not found');
    await this.repo.remove(item);
  }
}

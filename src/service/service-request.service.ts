import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { User, Role } from '../user/user-entity';
import { SettingsService } from '../settings/settings.service';
import { MailService } from '../mail/mail.service';
import { NotificationService } from '../notification/notification.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequest, ServiceStatus, TargetDepartment, PaidStatus, ClientDecision } from './service-request.entity';
import { CreateServiceRequestDto, UpdateServiceRequestDto } from './create-service-request.dto';
import { NotificationType } from '../notification/notification.entity';
import { Invoice, InvoiceStatus } from '../financial/entities/invoice.entity';

@Injectable()
export class ServiceRequestService {
  constructor(
    @InjectRepository(ServiceRequest)
    private readonly serviceRequestRepository: Repository<ServiceRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly settingsService: SettingsService,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
  ) {}

  async update(id: string, updateDto: UpdateServiceRequestDto, user: User): Promise<ServiceRequest> {
    const serviceRequest = await this.findOne(id, user);

    // Permission Check for Update
    const isDepartmentRelated = (
      (user.role === Role.MARKETING && serviceRequest.targetDepartment === TargetDepartment.MARKETING) ||
      (user.role === Role.LEGAL && serviceRequest.targetDepartment === TargetDepartment.LEGAL) ||
      (user.role === Role.FINANCE && serviceRequest.targetDepartment === TargetDepartment.FINANCE)
    );

    if (user.role !== Role.ADMIN && user.role !== Role.AGENT && !isDepartmentRelated) {
      throw new ForbiddenException('You do not have permission to update this request');
    }

    // Only agents/admins or the target department ADMIN can update status
    if (updateDto.status || updateDto.assignedAgentId) {
       const isDeptAdmin = (
         (user.role === Role.MARKETING_ADMIN && serviceRequest.targetDepartment === TargetDepartment.MARKETING) ||
         (user.role === Role.LEGAL_ADMIN && serviceRequest.targetDepartment === TargetDepartment.LEGAL) ||
         (user.role === Role.FINANCE_ADMIN && serviceRequest.targetDepartment === TargetDepartment.FINANCE)
       );

       if (user.role !== Role.AGENT && user.role !== Role.ADMIN && !isDeptAdmin) {
         throw new ForbiddenException('Only agents, admins, or the target department administrator can update request status');
       }
    }

    Object.assign(serviceRequest, updateDto);

    // Update timestamps based on status
    if (updateDto.status === ServiceStatus.ASSIGNED && !serviceRequest.assignedAt) {
      serviceRequest.assignedAt = new Date();
    }

    if (updateDto.status === ServiceStatus.COMPLETED && !serviceRequest.completedAt) {
      serviceRequest.completedAt = new Date();
    }

    return await this.serviceRequestRepository.save(serviceRequest);
  }

  async remove(id: string, user: User): Promise<void> {
    const serviceRequest = await this.findOne(id, user);

    // Only admins or the request owner can delete
    if (user.role !== Role.ADMIN && serviceRequest.userId !== user.id) {
      throw new ForbiddenException('You are not allowed to delete this request');
    }

    await this.serviceRequestRepository.remove(serviceRequest);
  }

  async getStatistics() {
    const [total, pending, assigned, completed] = await Promise.all([
      this.serviceRequestRepository.count(),
      this.serviceRequestRepository.count({ where: { status: ServiceStatus.PENDING } }),
      this.serviceRequestRepository.count({ where: { status: ServiceStatus.ASSIGNED } }),
      this.serviceRequestRepository.count({ where: { status: ServiceStatus.COMPLETED } }),
    ]);

    return {
      total,
      pending,
      assigned,
      completed,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  async getByCategory(category: string): Promise<ServiceRequest[]> {
    return await this.serviceRequestRepository.find({
      where: { category: category as any },
      order: { createdAt: 'DESC' }
    });
  }

  private checkPermissions(serviceRequest: ServiceRequest, user?: User): void {
    if (!user) return;

    // Admins can see everything
    if (user.role === Role.ADMIN) return;

    // Agents can see assigned requests
    if (user.role === Role.AGENT && serviceRequest.assignedAgentId === user.id) return;

    // Users can see their own requests
    if (user.role === Role.USER && serviceRequest.userId === user.id) return;

    throw new ForbiddenException('You do not have permission to view this request');
  }

    async create(createDto: CreateServiceRequestDto, user: User) {
    const targetDepartment = createDto.targetDepartment || this.resolveTargetDepartment(createDto.category);
    const price = await this.calculateDefaultPrice(createDto.category, createDto.serviceType);

    // Workflow Logic: Construction and Legal are auto-approved (will flip on payment)
    // Post-Purchase and Other require manual admin approval
    const requiresManualApproval = ['postPurchase', 'other'].includes(createDto.category);

    // Differentiated Invoice Flow:
    // Legal and Marketing require manual admin pricing and client accept/reject.
    // All other categories skip the accept/reject flow and instantly generate an unpaid invoice.
    const requiresManualPricing = ['legal', 'marketing'].includes(createDto.category);

    const serviceRequest = this.serviceRequestRepository.create({
      ...createDto,
      user:user,
      userId: user?.id || null,
      targetDepartment,
      price: price,
      paymentStatus: PaidStatus.UNPAID,
      adminAccepted: !requiresManualApproval,
      firstParty: createDto.firstParty,
      secondParty: createDto.secondParty,
      metadata: createDto.metadata,
      documentIds: createDto.documentIds,
      // If it doesn't require manual pricing, we treat the invoice as sent and accepted immediately
      invoiceSent: !requiresManualPricing,
      clientDecision: !requiresManualPricing ? ClientDecision.ACCEPTED : ClientDecision.PENDING,
      invoicePrice: !requiresManualPricing ? price : undefined,
    });

    const savedRequest = await this.serviceRequestRepository.save(serviceRequest);

    // Actively generate the Invoice entity for non-manual-pricing categories
    if (!requiresManualPricing && user) {
      try {
        const invoice = this.invoiceRepository.create({
          amount: price || 0,
          total: price || 0,
          status: InvoiceStatus.UNPAID,
          description: `فاتورة خدمة: ${savedRequest.serviceType}`,
          referenceType: 'ServiceRequest',
          referenceId: savedRequest.id,
          userId: user.id,
          user: user,
        });
        await this.invoiceRepository.save(invoice);
      } catch (err) {
        console.error('Failed to auto-generate invoice entity for service request:', err);
      }
    }

    // Notify admins if manual approval is needed
    if (requiresManualApproval) {
      this.notifyAdminsOfNewRequest(savedRequest);
    }

    // For legal requests, notify admins and lawyers
    if (createDto.category === 'legal') {
      this.notifyLegalTeamOfNewRequest(savedRequest);
    }

    return savedRequest;
  }

  private async notifyAdminsOfNewRequest(request: ServiceRequest) {
    const admins = await this.userRepository.find({ where: { role: Role.ADMIN } });
    for (const admin of admins) {
      if (admin.email) {
        await this.mailService.sendNewServiceRequestNotification(admin.email, request);
      }
    }
  }

  private async notifyLegalTeamOfNewRequest(request: ServiceRequest) {
    const [admins, lawyers, legalAdmins] = await Promise.all([
      this.userRepository.find({ where: { role: Role.ADMIN } }),
      this.userRepository.find({ where: { role: Role.LEGAL } }),
      this.userRepository.find({ where: { role: Role.LEGAL_ADMIN } }),
    ]);

    const recipients = [...admins, ...lawyers, ...legalAdmins];

    for (const recipient of recipients) {
      try {
        if (recipient.email) {
          await this.mailService.sendLegalRequestNotification(recipient.email, request);
        }
        await this.notificationService.create(
          recipient.id,
          NotificationType.SERVICE_REQUEST,
          'طلب خدمة قانونية جديد',
          `تم استلام طلب جديد: ${request.serviceType} من ${request.clientName}`,
          { serviceRequestId: request.id },
        );
      } catch (err) {
        console.error(`Failed to notify legal team member ${recipient.id}:`, err);
      }
    }
  }

  /** Admin: Set price and send invoice to the client */
  async sendInvoice(id: string, price: number, user: User): Promise<ServiceRequest> {
    const allowedRoles = [Role.ADMIN, Role.LEGAL, Role.LEGAL_ADMIN, Role.MARKETING, Role.MARKETING_ADMIN, Role.FINANCE, Role.FINANCE_ADMIN];
    if (!allowedRoles.includes(user.role as any)) {
      throw new ForbiddenException('You do not have permission to send invoices');
    }

    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!serviceRequest) throw new NotFoundException('Service request not found');

    serviceRequest.invoicePrice = price;
    serviceRequest.price = price;
    serviceRequest.invoiceSent = true;
    serviceRequest.clientDecision = ClientDecision.PENDING;

    const saved = await this.serviceRequestRepository.save(serviceRequest);

    // Notify client via email and in-app notification
    if (serviceRequest.user?.email) {
      await this.mailService.sendLegalInvoiceToClient(serviceRequest.user.email, saved);
    }

    if (serviceRequest.userId) {
      await this.notificationService.create(
        serviceRequest.userId,
        NotificationType.SERVICE_REQUEST,
        'تم إرسال الفاتورة الخاصة بطلبك',
        `الخدمة: ${saved.serviceType} - السعر: ${price} ريال. يرجى قبول أو رفض الفاتورة من المحفظة.`,
        { serviceRequestId: saved.id },
      ).catch(err => console.error('Failed to send client notification:', err));
    }

    return saved;
  }

  /** Client: Accept or reject the invoice */
  async clientDecision(id: string, decision: 'accepted' | 'rejected', user: User): Promise<ServiceRequest> {
    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id, userId: user.id },
      relations: ['user'],
    });

    if (!serviceRequest) throw new NotFoundException('Service request not found');
    if (!serviceRequest.invoiceSent) {
      throw new BadRequestException('No invoice has been sent yet for this request');
    }
    if (serviceRequest.clientDecision === ClientDecision.ACCEPTED) {
      throw new BadRequestException('You have already accepted this invoice. Payment is required.');
    }

    serviceRequest.clientDecision = decision === 'accepted' ? ClientDecision.ACCEPTED : ClientDecision.REJECTED;
    const saved = await this.serviceRequestRepository.save(serviceRequest);

    // Create actual Invoice entity if accepted
    if (decision === 'accepted') {
      try {
        const invoice = this.invoiceRepository.create({
          amount: serviceRequest.invoicePrice || 0,
          total: serviceRequest.invoicePrice || 0,
          status: InvoiceStatus.UNPAID,
          description: `فاتورة مبدئية لخدمة: ${serviceRequest.serviceType}`,
          referenceType: 'ServiceRequest',
          referenceId: serviceRequest.id,
          userId: user.id,
          user: user,
        });
        await this.invoiceRepository.save(invoice);
      } catch (err) {
        console.error('Failed to create invoice entity for accepted legal request:', err);
      }
    }

    // Notify admin and relevant team of client's decision
    const [admins, lawyers, legalAdmins, marketing, marketingAdmins] = await Promise.all([
      this.userRepository.find({ where: { role: Role.ADMIN } }),
      this.userRepository.find({ where: { role: Role.LEGAL } }),
      this.userRepository.find({ where: { role: Role.LEGAL_ADMIN } }),
      this.userRepository.find({ where: { role: Role.MARKETING } }),
      this.userRepository.find({ where: { role: Role.MARKETING_ADMIN } }),
    ]);

    let recipients = [...admins];
    if (serviceRequest.category === 'legal') {
      recipients = [...recipients, ...lawyers, ...legalAdmins];
    } else if (serviceRequest.category === 'marketing') {
      recipients = [...recipients, ...marketing, ...marketingAdmins];
    }
    const decisionText = decision === 'accepted' ? 'قَبِل' : 'رَفَض';

    for (const recipient of recipients) {
      try {
        if (recipient.email) {
          await this.mailService.sendLegalDecisionNotification(recipient.email, saved, decision);
        }
        await this.notificationService.create(
          recipient.id,
          NotificationType.SERVICE_REQUEST,
          `قرار العميل: ${decisionText} الفاتورة`,
          `العميل ${serviceRequest.user?.firstName || 'غير معروف'} ${decisionText} فاتورة الطلب: ${saved.serviceType}`,
          { serviceRequestId: saved.id, decision },
        );
      } catch (err) {
        console.error(`Failed to notify recipient ${recipient.id}:`, err);
      }
    }

    return saved;
  }



  async accept(id: string, user: User): Promise<ServiceRequest> {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can accept service requests');
    }

    const serviceRequest = await this.findOne(id, user);
    serviceRequest.adminAccepted = true;
    return await this.serviceRequestRepository.save(serviceRequest);
  }

  private resolveTargetDepartment(category: string): TargetDepartment {
    switch (category) {
      case 'legal':
        return TargetDepartment.LEGAL;
      case 'marketing':
        return TargetDepartment.MARKETING;
      case 'leasing':
      case 'postPurchase':
      case 'construction':
      case 'other':
      default:
        return TargetDepartment.REAL_ESTATE; // Default fallback for other if not specified
    }
  }

  async findAll(user: User) {
    const queryBuilder = this.serviceRequestRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.user', 'user');

    if (user.role === Role.USER) {
      queryBuilder.andWhere('service.userId = :userId', { userId: user.id });
    } else if ([Role.MARKETING, Role.MARKETING_ADMIN, Role.LEGAL, Role.LEGAL_ADMIN, Role.FINANCE, Role.FINANCE_ADMIN].includes(user.role as any) || user.role === Role.REAL_ESTATE_OFFICE) {
      // Departments only see accepted requests UNLESS it is legal department which can see all for processing
      if (user.role !== Role.LEGAL && user.role !== Role.LEGAL_ADMIN) {
        queryBuilder.andWhere('service.adminAccepted = :accepted', { accepted: true });
      }
      
      if (user.role === Role.MARKETING || user.role === Role.MARKETING_ADMIN) {
        queryBuilder.andWhere('service.targetDepartment = :dept', { dept: TargetDepartment.MARKETING });
      } else if (user.role === Role.LEGAL || user.role === Role.LEGAL_ADMIN) {
        queryBuilder.andWhere('service.targetDepartment = :dept', { dept: TargetDepartment.LEGAL });
      } else if (user.role === Role.FINANCE || user.role === Role.FINANCE_ADMIN) {
        queryBuilder.andWhere('service.targetDepartment = :dept', { dept: TargetDepartment.FINANCE });
      } else {
        queryBuilder.andWhere('service.targetDepartment = :dept', { dept: TargetDepartment.REAL_ESTATE });
      }
    }
    // Admins and Agents see everything (accepted or not)
 else if (user.role === Role.VIEWER) {
      // Viewer might see everything or a subset? Re-reading: "Can view request data"
      // Assuming they see all for now unless specified otherwise.
    }
    // ADMIN and AGENT see everything in this module

    return await queryBuilder
      .orderBy('service.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string, user: User) {
    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!serviceRequest) {
      throw new NotFoundException('Service request not found');
    }

    // Check permissions
    if (user.role === Role.ADMIN || user.role === Role.AGENT || user.role === Role.VIEWER) {
      return serviceRequest;
    }

    if (user.role === Role.USER && serviceRequest.userId === user.id) {
      return serviceRequest;
    }

    const isDepartmentRelated = (
      (user.role === Role.MARKETING && serviceRequest.targetDepartment === TargetDepartment.MARKETING) ||
      (user.role === Role.LEGAL && serviceRequest.targetDepartment === TargetDepartment.LEGAL) ||
      (user.role === Role.FINANCE && serviceRequest.targetDepartment === TargetDepartment.FINANCE)
    );

    if (isDepartmentRelated) {
       return serviceRequest;
    }

    throw new ForbiddenException('You do not have permission to view this service request');
  }

  // NEW METHOD: Get all unpaid service requests for a user
  async getUnpaidRequests(userId: string) {
    return await this.serviceRequestRepository.find({
      where: {
        userId,
        paymentStatus: PaidStatus.UNPAID,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // NEW METHOD: Get total unpaid amount for a user
  async getTotalUnpaidAmount(userId: string): Promise<number> {
    const result = await this.serviceRequestRepository
      .createQueryBuilder('service')
      .select('SUM(service.price * service.quantity)', 'total')
      .where('service.userId = :userId', { userId })
      .andWhere('service.paymentStatus = :status', { status: PaidStatus.UNPAID })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  // NEW METHOD: Mark service as paid
  async markAsPaid(id: string, user: User): Promise<ServiceRequest> {
    const serviceRequest = await this.findOne(id, user);
    serviceRequest.paymentStatus = PaidStatus.PAID;
    
    // Auto-approve Construction and Legal on payment
    if (['construction', 'legal'].includes(serviceRequest.category)) {
        serviceRequest.adminAccepted = true;
    }

    return this.serviceRequestRepository.save(serviceRequest);
  }

  // NEW METHOD: Get payment summary
  async getPaymentSummary(userId: string) {
    const [unpaidRequests, totalUnpaid] = await Promise.all([
      this.getUnpaidRequests(userId),
      this.getTotalUnpaidAmount(userId),
    ]);

    return {
      unpaidRequests,
      totalUnpaid,
      unpaidCount: unpaidRequests.length,
    };
  }

  private async calculateDefaultPrice(category: string, serviceType: string): Promise<number> {
    // Try to fetch custom price from settings first
    const settingKey = `service_price_${category}_${serviceType}`.replace(/\s+/g, '_').toLowerCase();
    const customPrice = await this.settingsService.findOne(settingKey);
    
    if (customPrice && customPrice.value) {
      const parsed = parseFloat(customPrice.value);
      if (!isNaN(parsed)) return parsed;
    }

    // Fallback to static price map
    const priceMap = {
      'postPurchase': {
        'الغاز': 150,
        'نقل وتركيب الأثاث': 300,
        'التأمين على المنزل': 500,
        'الصيانة (سباكة / كهرباء)': 200,
        'خدمة التنظيف': 250,
        'تنسيق حدائق': 400,
        'أنظمة أمنية': 600,
      },
      'legal': {
        'التوثيق ونقل الملكية': 1000,
        'تحديث الصكوك': 800,
        'حل المنازعات العقارية': 1500,
        'صياغة ومراجعة العقود العقارية': 1200,
        'تقديم الاستشارات العقارية': 500,
      },
      'construction': {
        'مقاول عظم': 5000,
        'تصميم هندسي': 2000,
        'تشطيبات': 3000,
        'كهرباء': 1000,
        'سباكة': 1000,
        'نجارة': 1500,
        'دهانات': 1200,
        'ألمنيوم': 2000,
        'إشراف هندسي': 2500,
        'تصميم داخلي': 1800,
      },
      'marketing': {
      'تصوير فوتوغرافي للعقار': 800,
      'حملة إعلانية (وسائل التواصل الاجتماعي)': 2500,
      'حملة إعلانية (إعلانات طرق/تقليدية)': 5000,
    },
    'leasing': {
      'تأجير العقار': 1000,
      'إدارة عقود الإيجار': 500,
      'تحصيل الإيجارات': 300,
    },
    'visit': {
      'زيارة شخصية': 200,
      'زيارة بالنيابة': 300,
      'تصوير العقار': 400,
      'تقرير مفصل': 500,
      'جولة مع الوكيل': 250,
    },
    'other': {
      'التقييم العقاري': 1200,
      'المسح الهندسي': 1500,
      'تقرير عن الحي': 500,
    }
  };

    return priceMap[category]?.[serviceType] || 100;
  }

}
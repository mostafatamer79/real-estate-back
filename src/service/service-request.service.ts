import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { User, Role, Department } from '../user/user-entity';
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

  private async getOwnerIds(ownerId: string): Promise<string[]> {
    const user = await this.userRepository.findOne({ where: { id: ownerId } });
    if (!user) return [ownerId];

    if (user.role === Role.MANGER) {
        const subUsers = await this.userRepository.find({ where: { parentId: ownerId } });
        return [ownerId, ...subUsers.map(u => u.id)];
    }

    return [ownerId];
  }

  async update(id: string, updateDto: UpdateServiceRequestDto, user: User): Promise<ServiceRequest> {
    const serviceRequest = await this.findOne(id, user);

    // Permission Check for Update
    const userDepts = user.departments || [];
    const targetDept = serviceRequest.targetDepartment;

    // Map TargetDepartment to User Department Slug
    const targetToSlugMap: Record<string, string> = {
      [TargetDepartment.MARKETING]: 'marketing',
      [TargetDepartment.FINANCE]: 'finance',
      [TargetDepartment.LEGAL]: 'legal',
      [TargetDepartment.REAL_ESTATE]: 'properties',
      [TargetDepartment.EMPLOYEES]: 'employees',
    };
    const requiredDeptSlug = targetToSlugMap[targetDept];

    const isDepartmentRelated = userDepts.includes(requiredDeptSlug as Department);

    if (user.role !== Role.ADMIN && user.role !== Role.AGENT && !isDepartmentRelated && serviceRequest.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to update this request');
    }

    // Only agents/admins or the target department worker can update status (if they have permission)
    if (updateDto.status || updateDto.assignedAgentId) {
       if (user.role !== Role.AGENT && user.role !== Role.ADMIN && !isDepartmentRelated) {
         throw new ForbiddenException('Only agents, admins, or assigned department workers can update request status');
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
    const calculatedPrice = await this.calculateDefaultPrice(createDto.category, createDto.serviceType);
    const requestedPrice = typeof (createDto as any).price === 'number' ? (createDto as any).price : undefined;

    // Workflow Logic: Construction and Legal are auto-approved (will flip on payment)
    // Post-Purchase and Other require manual admin approval
    const requiresManualApproval = ['postPurchase', 'other'].includes(createDto.category);

    // Differentiated Invoice Flow:
    // Legal and Marketing require manual admin pricing and client accept/reject.
    // All other categories skip the accept/reject flow and instantly generate an unpaid invoice.
    const requiresManualPricing = ['legal', 'marketing'].includes(createDto.category);

    // Upsert behavior: user can only have one active request per (category + serviceType).
    // If an active request exists, allow updating the editable fields instead of creating duplicates.
    if (user?.id && createDto.category && createDto.serviceType) {
      const existing = await this.serviceRequestRepository.findOne({
        where: {
          userId: user.id,
          category: createDto.category as any,
          serviceType: createDto.serviceType as any,
        } as any,
        order: { createdAt: 'DESC' } as any,
      });

      if (existing && ![ServiceStatus.COMPLETED, ServiceStatus.CANCELLED].includes(existing.status as any)) {
        // Only allow update while still pending and not in an invoice/decision state.
        const canEdit =
          existing.status === ServiceStatus.PENDING &&
          existing.paymentStatus !== PaidStatus.PAID &&
          existing.clientDecision !== ClientDecision.ACCEPTED &&
          existing.clientDecision !== ClientDecision.REJECTED &&
          !existing.invoiceSent;

        if (!canEdit) {
          throw new BadRequestException('You already have an active request for this service');
        }

        existing.clientName = createDto.clientName ?? existing.clientName;
        existing.phone = createDto.phone ?? existing.phone;
        existing.city = createDto.city ?? existing.city;
        existing.district = createDto.district ?? existing.district;
        existing.quantity = createDto.quantity ?? existing.quantity;
        existing.description = createDto.description ?? existing.description;
        existing.firstParty = createDto.firstParty ?? existing.firstParty;
        existing.secondParty = createDto.secondParty ?? existing.secondParty;
        existing.metadata = createDto.metadata ?? existing.metadata;
        existing.documentIds = createDto.documentIds ?? existing.documentIds;
        if (typeof requestedPrice === 'number') existing.price = requestedPrice;

        const savedExisting = await this.serviceRequestRepository.save(existing);
        await this.notifyDepartmentOfNewRequest(savedExisting).catch(() => undefined);
        return savedExisting;
      }
    }

    const serviceRequest = this.serviceRequestRepository.create({
      ...createDto,
      user:user,
      userId: user?.id || null,
      targetDepartment,
      price: typeof requestedPrice === 'number' ? requestedPrice : calculatedPrice,
      paymentStatus: PaidStatus.UNPAID,
      adminAccepted: !requiresManualApproval,
      firstParty: createDto.firstParty,
      secondParty: createDto.secondParty,
      metadata: createDto.metadata,
      documentIds: createDto.documentIds,
      // If it doesn't require manual pricing, we treat the invoice as sent and accepted immediately
      invoiceSent: !requiresManualPricing,
      clientDecision: !requiresManualPricing ? ClientDecision.ACCEPTED : ClientDecision.PENDING,
      invoicePrice: !requiresManualPricing ? (typeof requestedPrice === 'number' ? requestedPrice : calculatedPrice) : undefined,
    });

    const savedRequest = await this.serviceRequestRepository.save(serviceRequest);

    // Actively generate the Invoice entity for non-manual-pricing categories
    if (!requiresManualPricing && user) {
      try {
        const invoiceAmount = typeof requestedPrice === 'number' ? requestedPrice : calculatedPrice;
        const invoice = this.invoiceRepository.create({
          amount: invoiceAmount || 0,
          total: invoiceAmount || 0,
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

    // Notify the target department team
    await this.notifyDepartmentOfNewRequest(savedRequest);

    return savedRequest;
  }

  private async notifyDepartmentOfNewRequest(request: ServiceRequest) {
    const targetDept = request.targetDepartment;
    const targetToSlugMap: Record<string, string> = {
      [TargetDepartment.MARKETING]: 'marketing',
      [TargetDepartment.FINANCE]: 'finance',
      [TargetDepartment.LEGAL]: 'legal',
      [TargetDepartment.REAL_ESTATE]: 'properties',
      [TargetDepartment.EMPLOYEES]: 'employees',
    };
    const deptSlug = targetToSlugMap[targetDept];

    const hasDeptAccess = (u: User, dept: string) => {
      if (!u) return false;
      if (u.role === Role.ADMIN) return true;
      const userDepartments = Array.isArray(u.departments) ? u.departments : [];
      const departmentPermissions = u.departmentPermissions || {};
      return (
        userDepartments.includes(dept as any) ||
        departmentPermissions[dept] === true ||
        departmentPermissions[dept] === 'manage' ||
        departmentPermissions[dept] === 'view'
      );
    };

    // Notify only staff who can access this department (not every manager/employee).
    // NOTE: Admins for manual approval are handled by notifyAdminsOfNewRequest().
    const staffRoles = [
      Role.MANGER,
      Role.EMPLOYEE,
      Role.MARKETING,
      Role.MARKETING_ADMIN,
      Role.LEGAL,
      Role.LEGAL_ADMIN,
      Role.FINANCE,
      Role.FINANCE_ADMIN,
      Role.AGENT,
    ];

    const allStaff = await this.userRepository.find({
      where: {
        role: (require('typeorm').In)(staffRoles),
      },
    });

    const recipients = allStaff.filter((u) => hasDeptAccess(u, deptSlug));

    // Remove duplicates
    const uniqueRecipients = Array.from(new Map(recipients.map(r => [r.id, r])).values());

    for (const recipient of uniqueRecipients) {
      try {
        if (recipient.email) {
          if (request.category === 'legal') {
             await this.mailService.sendLegalRequestNotification(recipient.email, request);
          } else {
            //  await this.mailService.sendNewServiceRequestNotification(recipient.email, request);
          }
        }
        await this.notificationService.create(
          recipient.id,
          NotificationType.SERVICE_REQUEST,
          request.category === 'legal' ? 'طلب خدمة قانونية جديد' : 'طلب خدمة جديد لقسمك',
          `تم استلام طلب جديد: ${request.serviceType}. يمكنك مراجعته وتقديم عرض الآن.`,
          { serviceRequestId: request.id },
        );
      } catch (err) {
        console.error(`Failed to notify dept member ${recipient.id}:`, err);
      }
    }
  }

  private async notifyAdminsOfNewRequest(request: ServiceRequest) {
    const admins = await this.userRepository.find({ where: { role: Role.ADMIN } });
    // for (const admin of admins) {
    //   if (admin.email) {
    //     await this.mailService.sendNewServiceRequestNotification(admin.email, request);
    //   }
    // }
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

    // Only allow sending invoice for the request's department unless admin.
    const targetToSlugMap: Record<string, string> = {
      [TargetDepartment.MARKETING]: 'marketing',
      [TargetDepartment.FINANCE]: 'finance',
      [TargetDepartment.LEGAL]: 'legal',
      [TargetDepartment.REAL_ESTATE]: 'properties',
      [TargetDepartment.EMPLOYEES]: 'employees',
    };
    const deptSlug = targetToSlugMap[serviceRequest.targetDepartment];
    const userDepartments = Array.isArray(user.departments) ? user.departments : [];
    const departmentPermissions = user.departmentPermissions || {};
    const hasDeptAccess =
      user.role === Role.ADMIN ||
      userDepartments.includes(deptSlug as any) ||
      departmentPermissions[deptSlug] === true ||
      departmentPermissions[deptSlug] === 'manage' ||
      departmentPermissions[deptSlug] === 'view';
    if (!hasDeptAccess) {
      throw new ForbiddenException('You do not have access to this department invoice');
    }

    // Validate the offered price is not below the default/base price.
    const basePrice = await this.calculateDefaultPrice(serviceRequest.category as any, serviceRequest.serviceType);
    if (typeof price !== 'number' || Number.isNaN(price) || price < basePrice) {
      throw new BadRequestException(`Invoice price must be at least the default price (${basePrice})`);
    }

    serviceRequest.invoicePrice = price;
    serviceRequest.price = price;
    serviceRequest.invoiceSent = true;
    serviceRequest.clientDecision = ClientDecision.PENDING;

    const saved = await this.serviceRequestRepository.save(serviceRequest);

    // Notify client via email and in-app notification
    if (serviceRequest.user?.email) {
      if (serviceRequest.category === 'legal') {
        await this.mailService.sendLegalInvoiceToClient(serviceRequest.user.email, saved);
      } else {
        // await this.mailService.sendNewServiceRequestNotification(serviceRequest.user.email, saved);
      }
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
          // await this.mailService.sendLegalDecisionNotification(recipient.email, saved, decision);
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

  async findAll(user: User, page: number = 1, limit: number = 10, onlyMine: boolean = false) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.serviceRequestRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.user', 'user');

    if ((user.role === Role.ADMIN || user.role === Role.AGENT) && !onlyMine) {
      // Admins and Agents see everything unless they request only theirs
    } else if (user.role === Role.USER || user.role === Role.VIEWER || onlyMine) {
      queryBuilder.andWhere('service.userId = :userId', { userId: user.id });
    } else {
      const ownerIds = await this.getOwnerIds(user.id);
      const userDeptsRaw = Array.isArray(user.departments) ? user.departments : [];
      const deptPerms = user.departmentPermissions || {};
      const deptSlugsFromPerms = Object.entries(deptPerms)
        .filter(([, v]) => v === true || v === 'manage' || v === 'view')
        .map(([k]) => String(k));
      const userDepts = Array.from(new Set([...userDeptsRaw, ...deptSlugsFromPerms]));
      const slugToTargetMap: Record<string, TargetDepartment> = {
        marketing: TargetDepartment.MARKETING,
        finance: TargetDepartment.FINANCE,
        legal: TargetDepartment.LEGAL,
        properties: TargetDepartment.REAL_ESTATE,
        employees: TargetDepartment.EMPLOYEES,
      };

      const targetDepts = userDepts.map(slug => slugToTargetMap[slug]).filter(Boolean);

      // Filter by department
      if (targetDepts.length > 0) {
        queryBuilder.andWhere('service.targetDepartment IN (:...targetDepts)', { targetDepts });
      } else {
        queryBuilder.andWhere('service.userId IN (:...ownerIds)', { ownerIds });
      }
    }

    const [items, total] = await queryBuilder
      .orderBy('service.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: User) {
    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!serviceRequest) {
      throw new NotFoundException('Service request not found');
    }

    // Admins/Agents see everything
    if (user.role === Role.ADMIN || user.role === Role.AGENT) {
      return serviceRequest;
    }

    // Clients and viewers can see their own requests
    if ((user.role === Role.USER || user.role === Role.VIEWER) && serviceRequest.userId === user.id) {
      return serviceRequest;
    }

    const userDepts = user.departments || [];
    const targetDept = serviceRequest.targetDepartment;
    const targetToSlugMap: Record<string, string> = {
      [TargetDepartment.MARKETING]: 'marketing',
      [TargetDepartment.FINANCE]: 'finance',
      [TargetDepartment.LEGAL]: 'legal',
      [TargetDepartment.REAL_ESTATE]: 'properties',
      [TargetDepartment.EMPLOYEES]: 'employees',
    };
    const requiredDeptSlug = targetToSlugMap[targetDept];

    if (userDepts.includes(requiredDeptSlug as Department)) {
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


  // Mapping from User.department slug to ServiceRequest.targetDepartment
  private readonly deptToTargetMap: Record<string, TargetDepartment> = {
    marketing: TargetDepartment.MARKETING,
    finance: TargetDepartment.FINANCE,
    legal: TargetDepartment.LEGAL,
    properties: TargetDepartment.REAL_ESTATE,
    employees: TargetDepartment.EMPLOYEES,
  };

  async findByDepartment(departmentSlug: string, user: User, countOnly: boolean = false): Promise<any> {
    // Permission check (match controller/DepartmentsGuard semantics):
    // user must have the department in `departments` OR in `departmentPermissions` (true/manage/view).
    if (user.role !== Role.ADMIN && user.role !== Role.AGENT) {
      const userDepartments = Array.isArray(user.departments) ? user.departments : [];
      const departmentPermissions = user.departmentPermissions || {};
      const canAccess =
        userDepartments.includes(departmentSlug as any) ||
        departmentPermissions[departmentSlug] === true ||
        departmentPermissions[departmentSlug] === 'manage' ||
        departmentPermissions[departmentSlug] === 'view';
      if (!canAccess) {
        throw new ForbiddenException('You do not have access to this department');
      }
    }

    const targetDept = this.deptToTargetMap[departmentSlug];
    const queryBuilder = this.serviceRequestRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.user', 'client');
    if (targetDept) {
      queryBuilder.where('service.targetDepartment = :dept', { dept: targetDept });
    }

    if (countOnly) {
      const allRequests = await queryBuilder.getMany();
      return {
        pending: allRequests.filter(r => r.status === ServiceStatus.PENDING).length,
        inProgress: allRequests.filter(r => [ServiceStatus.ASSIGNED, ServiceStatus.IN_PROGRESS].includes(r.status as any)).length,
        done: allRequests.filter(r => r.status === ServiceStatus.COMPLETED).length,
      };
    }

    return await queryBuilder.orderBy('service.createdAt', 'DESC').getMany();
  }

  /**
   * Department staff adds their department's price contribution to a service request.
   * The overall request price is recalculated as the sum of all department prices.
   */
  async addDepartmentPrice(
    id: string,
    price: number,
    note: string | undefined,
    user: User,
    explicitDeptSlug?: string,
  ): Promise<ServiceRequest> {
    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!serviceRequest) throw new NotFoundException('Service request not found');

    // Only allow pricing from the request's target department (or admin acting as that department).
    const targetToSlugMap: Record<string, string> = {
      [TargetDepartment.MARKETING]: 'marketing',
      [TargetDepartment.FINANCE]: 'finance',
      [TargetDepartment.LEGAL]: 'legal',
      [TargetDepartment.REAL_ESTATE]: 'properties',
      [TargetDepartment.EMPLOYEES]: 'employees',
    };
    const targetDeptSlug = targetToSlugMap[serviceRequest.targetDepartment] || 'properties';

    // Determine which department this user belongs to
    const userDepts = user.departments || [];
    if (user.role !== Role.ADMIN && userDepts.length === 0) {
      throw new ForbiddenException('You must belong to a department to add a price');
    }

    // Use the explicit dept slug from the request, or fallback to user's first department or target department.
    const deptSlug = explicitDeptSlug || (userDepts.length > 0 ? userDepts[0] : targetDeptSlug);

    // Lock pricing once invoice is sent / client decided / paid.
    if (serviceRequest.invoiceSent || serviceRequest.clientDecision === ClientDecision.ACCEPTED || serviceRequest.paymentStatus === PaidStatus.PAID) {
      throw new BadRequestException('Cannot change offer after it has been sent/accepted/paid');
    }

    // Update the departmentPrices map with full historical support
    const currentPrices = (serviceRequest.departmentPrices || {}) as any;
    const nextPrices = { ...currentPrices };

    if (currentPrices[deptSlug]) {
      throw new BadRequestException('تم تقديم عرض من هذا القسم مسبقاً وهو مقفل ولا يمكن تعديله');
    }

    nextPrices[deptSlug] = {
      price,
      addedBy: user.id,
      note,
      addedAt: new Date().toISOString(),
    };

    serviceRequest.departmentPrices = nextPrices;

    // Recalculate total price as sum of all department contributions
    serviceRequest.price = price;

    const saved = await this.serviceRequestRepository.save(serviceRequest);

    // Notify the client if they are registered
    if (serviceRequest.userId) {
      await this.notificationService.create(
        serviceRequest.userId,
        NotificationType.SERVICE_REQUEST,
        'تم تحديث سعر الخدمة',
        `تم تحديث عرض السعر لقسم ${deptSlug}: ${price} ريال`,
        { serviceRequestId: saved.id },
      ).catch(err => console.error('Failed to notify client of price update:', err));
    }

    return saved;
  }

  /**
   * Create or retrieve a chat room linked to this service request.
   * Returns the chatRoomId so the frontend can navigate to the chat.
   */
  async getOrCreateChatRoom(id: string, user: User, chatService: any): Promise<{ chatRoomId: string }> {
    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!serviceRequest) throw new NotFoundException('Service request not found');

    // Check access: admin, agent, the client, or any dept contributor
    const isOwner = serviceRequest.userId === user.id;
    const targetToSlugMap: Record<string, string> = {
      [TargetDepartment.MARKETING]: 'marketing',
      [TargetDepartment.FINANCE]: 'finance',
      [TargetDepartment.LEGAL]: 'legal',
      [TargetDepartment.REAL_ESTATE]: 'properties',
      [TargetDepartment.EMPLOYEES]: 'employees',
    };
    const requiredDeptSlug = targetToSlugMap[serviceRequest.targetDepartment];
    const userDepts = user.departments || [];
    const hasDeptAccess = userDepts.includes(requiredDeptSlug as Department) ||
      user.departmentPermissions?.[requiredDeptSlug] === true ||
      user.departmentPermissions?.[requiredDeptSlug] === 'manage' ||
      user.departmentPermissions?.[requiredDeptSlug] === 'view';
    const isStaff = user.role === Role.ADMIN || user.role === Role.AGENT || hasDeptAccess;
    const isContributor = Object.values(serviceRequest.departmentPrices || {}).some(e => e.addedBy === user.id);
    const isViewer = (user.role === Role.USER || user.role === Role.VIEWER) && isOwner;

    if (!isStaff && !isContributor && !isViewer) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    // If a chat room already exists, return it (staff can open/read/reply)
    if (serviceRequest.chatRoomId) {
      return { chatRoomId: serviceRequest.chatRoomId };
    }

    // Collect all participants: client + contributors + admins
    const participantIds = new Set<string>();
    if (serviceRequest.userId) participantIds.add(serviceRequest.userId);
    for (const entry of Object.values(serviceRequest.departmentPrices || {})) {
      if (entry.addedBy) participantIds.add(entry.addedBy);
    }
    participantIds.add(user.id);

    // Create the chat room via the ChatService
    const room = await chatService.createRoom(
      {
        name: `طلب خدمة #${serviceRequest.invoiceNumber || id.substring(0, 8)}`,
        description: `${serviceRequest.serviceType} - ${serviceRequest.clientName}`,
        userIds: Array.from(participantIds),
        isGroup: true,
        isPublic: false,
        serviceRequestId: serviceRequest.id,
      },
      user,
    );

    // Save the chatRoomId on the service request
    serviceRequest.chatRoomId = room.id;
    await this.serviceRequestRepository.save(serviceRequest);

    return { chatRoomId: room.id };
  }

  /**
   * Client accepts a specific department offer.
   * This sets the chosen price and can trigger further workflow steps.
   */
  async acceptDepartmentOffer(id: string, deptSlug: string, user: User): Promise<ServiceRequest> {
    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id, userId: user.id },
      relations: ['user'],
    });

    if (!serviceRequest) throw new NotFoundException('Service request not found or access denied');

    const offers = serviceRequest.departmentPrices || {};
    const chosenOffer = offers[deptSlug];

    if (!chosenOffer) throw new BadRequestException(`No offer found for department: ${deptSlug}`);

    serviceRequest.price = chosenOffer.price;
    serviceRequest.metadata = {
      ...(serviceRequest.metadata || {}),
      acceptedOffer: { dept: deptSlug, ...chosenOffer }
    };
    serviceRequest.clientDecision = ClientDecision.ACCEPTED;

    // If it's a category that requires an invoice, update the invoice if it exists
    const invoice = await this.invoiceRepository.findOne({
      where: { referenceId: serviceRequest.id, referenceType: 'ServiceRequest' }
    });
    if (invoice) {
      invoice.amount = chosenOffer.price;
      invoice.total = chosenOffer.price;
      await this.invoiceRepository.save(invoice);
    }

    return await this.serviceRequestRepository.save(serviceRequest);
  }

  /**
   * Create or retrieve a 1-on-1 chat room with a specific staff member who added a price.
   */
  async getOrCreateStaffChat(id: string, staffId: string, user: User, chatService: any): Promise<{ chatRoomId: string }> {
    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!serviceRequest) throw new NotFoundException('Service request not found');

    // Only the request owner (or admin) can initiate a direct 1-on-1 chat with a staff contributor.
    const isOwner = serviceRequest.userId === user.id;
    if (!isOwner && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only the request owner can start a direct chat');
    }

    // Check if the staff member actually contributed to this request
    const offers = serviceRequest.departmentPrices || {};
    const isContributor = Object.values(offers).some(e => e.addedBy === staffId);

    if (!isContributor && user.role !== Role.ADMIN) {
      throw new ForbiddenException('This staff member is not a contributor to this request');
    }

    // Create a 1-on-1 chat room
    const room = await chatService.createRoom(
      {
        name: `محادثة حول: ${serviceRequest.serviceType}`,
        description: `دردشة خاصة مع الموظف بخصوص طلب #${serviceRequest.invoiceNumber || id.substring(0, 8)}`,
        userIds: [user.id, staffId],
        isGroup: false,
        serviceRequestId: serviceRequest.id,
      },
      user,
    );

    return { chatRoomId: room.id };
  }

  /**
   * Create or retrieve a personal chat room for the user to keep notes/messages about this request.
   */
  async getOrCreateSelfChat(id: string, user: User, chatService: any): Promise<{ chatRoomId: string }> {
    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id },
    });

    if (!serviceRequest) throw new NotFoundException('Service request not found');

    const room = await chatService.createRoom(
      {
        name: `ملاحظاتي: ${serviceRequest.serviceType}`,
        description: `مساحة خاصة للملاحظات حول طلب #${serviceRequest.invoiceNumber || id.substring(0, 8)}`,
        userIds: [user.id],
        isGroup: false,
        serviceRequestId: serviceRequest.id,
      },
      user,
    );

    return { chatRoomId: room.id };
  }
}

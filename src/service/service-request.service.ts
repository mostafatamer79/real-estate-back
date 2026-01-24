// src/service-request/service-request.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaidStatus, ServiceRequest, ServiceStatus } from './service-request.entity';
import { CreateServiceRequestDto,UpdateServiceRequestDto } from './create-service-request.dto';
import { User, Role } from '../user/user-entity';

@Injectable()
export class ServiceRequestService {
  constructor(
    @InjectRepository(ServiceRequest)
    private readonly serviceRequestRepository: Repository<ServiceRequest>,
  ) {}

  async update(id: string, updateDto: UpdateServiceRequestDto, user: User): Promise<ServiceRequest> {
    const serviceRequest = await this.findOne(id, user);

    // Only agents or admins can update status and assign agents
    if (updateDto.status || updateDto.assignedAgentId) {
      if (user.role !== Role.AGENT && user.role !== Role.ADMIN) {
        throw new ForbiddenException('Only agents or admins can update request status');
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
    const serviceRequest = this.serviceRequestRepository.create({
      ...createDto,
      user:user,
      userId: user?.id || null,
      price: this.calculateDefaultPrice(createDto.category, createDto.serviceType),
      paymentStatus: PaidStatus.UNPAID, // Default to unpaid
    });

    return await this.serviceRequestRepository.save(serviceRequest);
  }

  async findAll(user: User) {
    const queryBuilder = this.serviceRequestRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.user', 'user');

    if (user.role === Role.USER) {
      queryBuilder.where('service.userId = :userId', { userId: user.id });
    }

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
    if (user.role ===  Role.USER && serviceRequest.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to view this service request');
    }

    return serviceRequest;
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
  async markAsPaid(id: string, user: User) {
    const serviceRequest = await this.findOne(id, user);

    if (serviceRequest.paymentStatus === PaidStatus.PAID) {
      throw new Error('Service is already paid');
    }

    serviceRequest.paymentStatus = PaidStatus.PAID;
    serviceRequest.updatedAt = new Date();

    return await this.serviceRequestRepository.save(serviceRequest);
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

  private calculateDefaultPrice(category: string, serviceType: string): number {
    // You can implement your pricing logic here
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
      // Add more categories and services as needed
    };

    return priceMap[category]?.[serviceType] || 100; // Default price
  }

}
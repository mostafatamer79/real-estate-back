// src/service-request/service-request.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequest, ServiceStatus } from './service-request.entity';
import { CreateServiceRequestDto,UpdateServiceRequestDto } from './create-service-request.dto';
import { User, Role } from '../user/user-entity';

@Injectable()
export class ServiceRequestService {
  constructor(
    @InjectRepository(ServiceRequest)
    private readonly serviceRequestRepository: Repository<ServiceRequest>,
  ) {}

  async create(createDto: CreateServiceRequestDto, user?: User): Promise<ServiceRequest> {
    const serviceRequest = this.serviceRequestRepository.create({
      ...createDto,
      userId: user?.id,
    });

    return await this.serviceRequestRepository.save(serviceRequest);
  }

  async findAll(user?: User): Promise<ServiceRequest[]> {
    let query = this.serviceRequestRepository.createQueryBuilder('request')
      .orderBy('request.createdAt', 'DESC');

    // If user is agent, show assigned requests
    if (user?.role === Role.AGENT) {
      query = query.where('request.assignedAgentId = :agentId', { agentId: user.id });
    }
    // If user is regular user, show their requests
    else if (user?.role === Role.USER && user.id) {
      query = query.where('request.userId = :userId', { userId: user.id });
    }

    return await query.getMany();
  }

  async findOne(id: string, user?: User): Promise<ServiceRequest> {
    const serviceRequest = await this.serviceRequestRepository.findOne({ 
      where: { id },
      relations: ['user']
    });

    if (!serviceRequest) {
      throw new NotFoundException('Service request not found');
    }

    // Check permissions
    this.checkPermissions(serviceRequest, user);

    return serviceRequest;
  }

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
}
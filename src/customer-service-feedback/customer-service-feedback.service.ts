import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CustomerServiceFeedback,
  CustomerServiceFeedbackStatus,
} from './entities/customer-service-feedback.entity';
import { CreateCustomerServiceFeedbackDto } from './dto/create-customer-service-feedback.dto';
import { UpdateCustomerServiceFeedbackDto } from './dto/update-customer-service-feedback.dto';

@Injectable()
export class CustomerServiceFeedbackService {
  constructor(
    @InjectRepository(CustomerServiceFeedback)
    private readonly repo: Repository<CustomerServiceFeedback>,
  ) {}

  findAll(): Promise<CustomerServiceFeedback[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
    });
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
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateCustomerServiceFeedbackDto): Promise<CustomerServiceFeedback> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Feedback not found');
    item.status = dto.status;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Feedback not found');
    await this.repo.remove(item);
  }
}


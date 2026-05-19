import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { In } from 'typeorm';
import { CustomerServiceFaqCategory } from './entities/customer-service-faq-category.entity';
import { CreateCustomerServiceFaqCategoryDto } from './dto/create-customer-service-faq-category.dto';
import { UpdateCustomerServiceFaqCategoryDto } from './dto/update-customer-service-faq-category.dto';

@Injectable()
export class CustomerServiceFaqCategoryService {
  constructor(
    @InjectRepository(CustomerServiceFaqCategory)
    private readonly repo: Repository<CustomerServiceFaqCategory>,
  ) {}

  findAll(): Promise<CustomerServiceFaqCategory[]> {
    return this.repo.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<CustomerServiceFaqCategory> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Category not found');
    return item;
  }

  create(dto: CreateCustomerServiceFaqCategoryDto): Promise<CustomerServiceFaqCategory> {
    const item = this.repo.create({ ...dto, sortOrder: dto.sortOrder ?? 0 });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateCustomerServiceFaqCategoryDto): Promise<CustomerServiceFaqCategory> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }

  async reorder(ids: string[]) {
    // Persist order as spaced integers to allow future insertions.
    const items = await this.repo.find({ where: { id: In(ids) } });
    const byId = new Map(items.map((i) => [i.id, i]));
    const updates: CustomerServiceFaqCategory[] = [];
    ids.forEach((id, idx) => {
      const item = byId.get(id);
      if (!item) return;
      item.sortOrder = (idx + 1) * 10;
      updates.push(item);
    });
    await this.repo.save(updates);
    return this.findAll();
  }
}

import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { In } from 'typeorm';
import { CustomerServiceFaq } from './entities/customer-service-faq.entity';
import { CreateCustomerServiceFaqDto } from './dto/create-customer-service-faq.dto';
import { UpdateCustomerServiceFaqDto } from './dto/update-customer-service-faq.dto';
import { DEFAULT_CUSTOMER_SERVICE_FAQS } from './default-faqs';
import { DEFAULT_CUSTOMER_SERVICE_FAQ_CATEGORIES } from './default-faqs';
import { CustomerServiceFaqCategory } from './entities/customer-service-faq-category.entity';

@Injectable()
export class CustomerServiceFaqService implements OnModuleInit {
  private readonly logger = new Logger(CustomerServiceFaqService.name);
  private schemaReady = true;

  constructor(
    @InjectRepository(CustomerServiceFaq)
    private readonly repo: Repository<CustomerServiceFaq>,
    @InjectRepository(CustomerServiceFaqCategory)
    private readonly categoriesRepo: Repository<CustomerServiceFaqCategory>,
  ) {}

  async onModuleInit() {
    await this.ensureSeeded({ failSilently: true });
  }

  private isMissingRelationError(error: unknown): boolean {
    return (
      !!error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === '42P01'
    );
  }

  private buildDefaultFaqs(): CustomerServiceFaq[] {
    return DEFAULT_CUSTOMER_SERVICE_FAQS.map((dto: any, idx: number) => {
      const category = DEFAULT_CUSTOMER_SERVICE_FAQ_CATEGORIES.find(
        (item) => item.key === dto.categoryKey,
      );

      return {
        id: `default-faq-${idx}`,
        categoryAr: category?.nameAr ?? '',
        categoryEn: category?.nameEn ?? '',
        categoryId: null,
        category: null,
        questionAr: dto.questionAr,
        answerAr: dto.answerAr,
        questionEn: dto.questionEn,
        answerEn: dto.answerEn,
        sortOrder: dto.sortOrder ?? 0,
        createdAt: new Date(0),
        updatedAt: new Date(0),
      } as CustomerServiceFaq;
    });
  }

  private async ensureSeeded(options?: { failSilently?: boolean }) {
    try {
      const [faqCount, catCount] = await Promise.all([
        this.repo.count(),
        this.categoriesRepo.count(),
      ]);
      this.schemaReady = true;
      if (faqCount > 0 && catCount > 0) return;
      await this.seedDefaults();
    } catch (error) {
      if (this.isMissingRelationError(error) && options?.failSilently) {
        this.schemaReady = false;
        this.logger.warn(
          'Customer service FAQ tables are missing. Skipping DB seed and using fallback defaults until the schema is created.',
        );
        return;
      }

      throw error;
    }
  }

  private async seedDefaults() {
    // Seed categories if missing
    const existingCategories = await this.categoriesRepo.find();
    const byKey = new Map<string, CustomerServiceFaqCategory>();

    for (const def of DEFAULT_CUSTOMER_SERVICE_FAQ_CATEGORIES) {
      const match = existingCategories.find(
        (c) => c.nameAr === def.nameAr || c.nameEn === def.nameEn,
      );
      const cat = match
        ? match
        : await this.categoriesRepo.save(
            this.categoriesRepo.create({
              nameAr: def.nameAr,
              nameEn: def.nameEn,
              sortOrder: def.sortOrder ?? 0,
            }),
          );
      byKey.set(def.key, cat);
    }

    const faqEntities = DEFAULT_CUSTOMER_SERVICE_FAQS.map((dto: any) => {
      const cat = byKey.get(dto.categoryKey);
      return this.repo.create({
        categoryId: cat?.id ?? null,
        categoryAr: cat?.nameAr ?? '',
        categoryEn: cat?.nameEn ?? '',
        questionAr: dto.questionAr,
        answerAr: dto.answerAr,
        questionEn: dto.questionEn,
        answerEn: dto.answerEn,
        sortOrder: dto.sortOrder ?? 0,
      });
    });
    await this.repo.save(faqEntities);
  }

  async resetToDefaults() {
    await this.repo.delete({});
    await this.categoriesRepo.delete({});
    await this.seedDefaults();
    return this.findAll();
  }

  findAll(): Promise<CustomerServiceFaq[]> {
    return (async () => {
      await this.ensureSeeded({ failSilently: true });
      if (!this.schemaReady) {
        return this.buildDefaultFaqs();
      }

      // Order by category.sortOrder then question.sortOrder for stable UI.
      return this.repo
        .createQueryBuilder('faq')
        .leftJoinAndSelect('faq.category', 'category')
        .orderBy('COALESCE(category.sortOrder, 999999)', 'ASC')
        .addOrderBy('faq.sortOrder', 'ASC')
        .addOrderBy('faq.createdAt', 'ASC')
        .getMany();
    })();
  }

  async findOne(id: string): Promise<CustomerServiceFaq> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('FAQ not found');
    return item;
  }

  async create(dto: CreateCustomerServiceFaqDto): Promise<CustomerServiceFaq> {
    // If categoryId is provided, fill categoryAr/categoryEn from category table
    if (dto.categoryId) {
      const cat = await this.categoriesRepo.findOne({ where: { id: dto.categoryId } });
      if (cat) {
        (dto as any).categoryAr = cat.nameAr;
        (dto as any).categoryEn = cat.nameEn;
      }
    }
    const item = this.repo.create({
      ...dto,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateCustomerServiceFaqDto): Promise<CustomerServiceFaq> {
    const item = await this.findOne(id);
    if ((dto as any).categoryId) {
      const cat = await this.categoriesRepo.findOne({ where: { id: (dto as any).categoryId } });
      if (cat) {
        (dto as any).categoryAr = cat.nameAr;
        (dto as any).categoryEn = cat.nameEn;
      }
    }
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }

  async reorder(categoryId: string, ids: string[]) {
    const items = await this.repo.find({ where: { id: In(ids), categoryId } });
    const byId = new Map(items.map((i) => [i.id, i]));
    const updates: CustomerServiceFaq[] = [];
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

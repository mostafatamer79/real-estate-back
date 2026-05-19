import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerServiceFaq } from './entities/customer-service-faq.entity';
import { CustomerServiceFaqCategory } from './entities/customer-service-faq-category.entity';
import { CustomerServiceFaqService } from './customer-service-faq.service';
import { CustomerServiceFaqController } from './customer-service-faq.controller';
import { CustomerServiceFaqCategoryController } from './customer-service-faq-category.controller';
import { CustomerServiceFaqCategoryService } from './customer-service-faq-category.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerServiceFaq, CustomerServiceFaqCategory])],
  controllers: [CustomerServiceFaqController, CustomerServiceFaqCategoryController],
  providers: [CustomerServiceFaqService, CustomerServiceFaqCategoryService],
})
export class CustomerServiceFaqModule {}

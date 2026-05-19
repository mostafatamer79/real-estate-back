import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerServiceFaqCategoryDto } from './create-customer-service-faq-category.dto';

export class UpdateCustomerServiceFaqCategoryDto extends PartialType(CreateCustomerServiceFaqCategoryDto) {}


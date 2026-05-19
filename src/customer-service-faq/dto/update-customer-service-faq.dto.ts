import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerServiceFaqDto } from './create-customer-service-faq.dto';

export class UpdateCustomerServiceFaqDto extends PartialType(CreateCustomerServiceFaqDto) {}


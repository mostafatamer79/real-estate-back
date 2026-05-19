import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CustomerServiceFaqService } from './customer-service-faq.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorators';
import { Role } from '../user/user-entity';
import { CreateCustomerServiceFaqDto } from './dto/create-customer-service-faq.dto';
import { UpdateCustomerServiceFaqDto } from './dto/update-customer-service-faq.dto';
import { ReorderDto } from './dto/reorder.dto';

@Controller('customer-service/faqs')
export class CustomerServiceFaqController {
  constructor(private readonly service: CustomerServiceFaqService) {}

  @Public()
  @Get()
  async list() {
    const data = await this.service.findAll();
    return { success: true, data };
  }

  @Roles([Role.ADMIN])
  @Post()
  async create(@Body() dto: CreateCustomerServiceFaqDto) {
    const data = await this.service.create(dto);
    return { success: true, data };
  }

  @Roles([Role.ADMIN])
  @Post('reset-defaults')
  async resetDefaults() {
    const data = await this.service.resetToDefaults();
    return { success: true, data };
  }

  @Roles([Role.ADMIN])
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerServiceFaqDto) {
    const data = await this.service.update(id, dto);
    return { success: true, data };
  }

  @Roles([Role.ADMIN])
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }

  @Roles([Role.ADMIN])
  @Post('reorder/:categoryId')
  async reorder(@Param('categoryId') categoryId: string, @Body() dto: ReorderDto) {
    const data = await this.service.reorder(categoryId, dto.ids || []);
    return { success: true, data };
  }
}

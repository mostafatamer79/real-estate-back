import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorators';
import { Role } from '../user/user-entity';
import { CreateCustomerServiceFaqCategoryDto } from './dto/create-customer-service-faq-category.dto';
import { UpdateCustomerServiceFaqCategoryDto } from './dto/update-customer-service-faq-category.dto';
import { CustomerServiceFaqCategoryService } from './customer-service-faq-category.service';
import { ReorderDto } from './dto/reorder.dto';

@Controller('customer-service/faq-categories')
export class CustomerServiceFaqCategoryController {
  constructor(private readonly service: CustomerServiceFaqCategoryService) {}

  @Public()
  @Get()
  async list() {
    const data = await this.service.findAll();
    return { success: true, data };
  }

  @Roles([Role.ADMIN])
  @Post()
  async create(@Body() dto: CreateCustomerServiceFaqCategoryDto) {
    const data = await this.service.create(dto);
    return { success: true, data };
  }

  @Roles([Role.ADMIN])
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerServiceFaqCategoryDto) {
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
  @Post('reorder')
  async reorder(@Body() dto: ReorderDto) {
    const data = await this.service.reorder(dto.ids || []);
    return { success: true, data };
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorators';
import { Role } from '../user/user-entity';
import { CreateCustomerServiceFeedbackDto } from './dto/create-customer-service-feedback.dto';
import { UpdateCustomerServiceFeedbackDto } from './dto/update-customer-service-feedback.dto';
import { CustomerServiceFeedbackService } from './customer-service-feedback.service';

@Controller('customer-service/feedback')
export class CustomerServiceFeedbackController {
  constructor(private readonly service: CustomerServiceFeedbackService) {}

  @Public()
  @Post()
  async create(@Body() dto: CreateCustomerServiceFeedbackDto, @Req() req: Request) {
    const userId = (req as any)?.user?.id ?? null;
    const data = await this.service.create(dto, userId);
    return { success: true, data };
  }

  @Roles([Role.ADMIN])
  @Get()
  async list() {
    const data = await this.service.findAll();
    return { success: true, data };
  }

  @Get('my')
  async listMine(@Req() req: Request) {
    const data = await this.service.findMine((req as any).user);
    return { success: true, data };
  }

  @Roles([Role.ADMIN])
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerServiceFeedbackDto) {
    const data = await this.service.update(id, dto);
    return { success: true, data };
  }

  @Roles([Role.ADMIN])
  @Patch(':id/admin-reply')
  async adminReply(@Param('id') id: string, @Body('reply') reply: string, @Req() req: Request) {
    const data = await this.service.replyAsAdmin(id, reply, (req as any).user?.id ?? null);
    return { success: true, data };
  }

  @Patch(':id/user-reply')
  async userReply(@Param('id') id: string, @Body('reply') reply: string, @Req() req: Request) {
    const data = await this.service.replyAsUser(id, reply, (req as any).user);
    return { success: true, data };
  }

  @Roles([Role.ADMIN])
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }
}

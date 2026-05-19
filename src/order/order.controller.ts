import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Patch, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { Request } from 'express';
import { Departments } from '../common/decorators/departments.decorators';
import { DepartmentsGuard } from '../common/guards/departments.guard';
import { Role } from '../user/user-entity';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard, DepartmentsGuard)
  @Departments('properties', 'orders')
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    return this.orderService.create(createOrderDto, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, DepartmentsGuard)
  @Departments('properties', 'orders')
  findAll(@Req() req: any) {
    return this.orderService.findAll(req.user);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  findMyOrders(@Req() req: any) {
    const userId = req.user.id || req.user.userId;
    return this.orderService.findByUser(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, DepartmentsGuard)
  @Departments('properties', 'orders')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, DepartmentsGuard)
  @Departments('properties', 'orders')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, DepartmentsGuard)
  @Departments('properties', 'orders')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.orderService.updateStatus(id, status);
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, DepartmentsGuard)
  @Departments('properties', 'orders')
  assignOrder(@Param('id') id: string, @Body('assignedToId') assignedToId: string) {
    return this.orderService.assignOrder(id, assignedToId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, DepartmentsGuard)
  @Departments('properties', 'orders')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.orderService.remove(id);
  }
}

// src/service-request/service-request.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ParseUUIDPipe,
    ForbiddenException
  } from '@nestjs/common';
  import { ServiceRequestService } from './service-request.service';
  import { CreateServiceRequestDto, UpdateServiceRequestDto, AddDepartmentPriceDto } from './create-service-request.dto';

import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { ChatService } from '../chat/chat.service';
import { SkipSubscriptionGuard } from '../common/decorators/skip-subscription.decorator';

  @SkipSubscriptionGuard()
  @Controller('service-requests')
  export class ServiceRequestController {
    constructor(
      private readonly serviceRequestService: ServiceRequestService,
      private readonly chatService: ChatService,
    ) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Body() createDto: CreateServiceRequestDto, @Request() req) {
      return this.serviceRequestService.create(createDto, req.user);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(
      @Request() req,
      @Query('page') page: string = '1',
      @Query('limit') limit: string = '10',
      @Query('mine') mine: string = 'false'
    ) {
      return this.serviceRequestService.findAll(req.user, parseInt(page), parseInt(limit), mine === 'true');
    }

    @Get('category/:category')
    @UseGuards(JwtAuthGuard)
    async getByCategory(@Param('category') category: string) {
      return this.serviceRequestService.getByCategory(category);
    }

    @Get('statistics')
    @UseGuards(JwtAuthGuard)
    async getStatistics() {
      return this.serviceRequestService.getStatistics();
    }

    @Get('by-department/:department')
    @UseGuards(JwtAuthGuard)
    async findByDepartment(
      @Param('department') department: string,
      @Query('countOnly') countOnly: string,
      @Request() req
    ) {
      const userDepartments = Array.isArray(req.user?.departments) ? req.user.departments : [];
      const departmentPermissions = req.user?.departmentPermissions || {};
      const canAccess =
        userDepartments.includes(department) ||
        departmentPermissions[department] === true ||
        departmentPermissions[department] === 'manage' ||
        departmentPermissions[department] === 'view';

      if (!canAccess) {
        throw new ForbiddenException('Access denied');
      }
      return this.serviceRequestService.findByDepartment(department, req.user, countOnly === 'true');
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
      return this.serviceRequestService.findOne(id, req.user);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    async update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateDto: UpdateServiceRequestDto,
      @Request() req
    ) {
      return this.serviceRequestService.update(id, updateDto, req.user);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
      return this.serviceRequestService.remove(id, req.user);
    }
      @Get('unpaid/my-requests')
  @UseGuards(JwtAuthGuard)
  async getMyUnpaidRequests(@Request() req) {
    return this.serviceRequestService.getUnpaidRequests(req.user.id);
  }

  // NEW ENDPOINT: Get payment summary
  @Get('payment/summary')
  @UseGuards(JwtAuthGuard)
  async getPaymentSummary(@Request() req) {
    return this.serviceRequestService.getPaymentSummary(req.user.id);
  }

  // NEW ENDPOINT: Mark service as paid
  @Put(':id/mark-paid')
  @UseGuards(JwtAuthGuard)
  async markAsPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req
  ) {
    return this.serviceRequestService.markAsPaid(id, req.user);
  }

  // NEW ENDPOINT: Accept service request (Admin only)
  @Put(':id/accept')
  @UseGuards(JwtAuthGuard)
  async accept(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req
  ) {
    return this.serviceRequestService.accept(id, req.user);
  }

  // NEW ENDPOINT: Get total unpaid amount
  @Get('payment/total-unpaid')
  @UseGuards(JwtAuthGuard)
  async getTotalUnpaidAmount(@Request() req) {
    const total = await this.serviceRequestService.getTotalUnpaidAmount(req.user.id);
    return { totalUnpaid: total };
  }

  // LEGAL WORKFLOW: Admin sends invoice to client
  @Put(':id/send-invoice')
  @UseGuards(JwtAuthGuard)
  async sendInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { price: number },
    @Request() req
  ) {
    return this.serviceRequestService.sendInvoice(id, body.price, req.user);
  }

  // LEGAL WORKFLOW: Client accepts or rejects the invoice
  @Put(':id/client-decision')
  @UseGuards(JwtAuthGuard)
  async clientDecision(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { decision: 'accepted' | 'rejected' },
    @Request() req
  ) {
    return this.serviceRequestService.clientDecision(id, body.decision, req.user);
  }

  // DEPARTMENT PRICING: Staff member adds their department's price
  @Put(':id/department-price')
  @UseGuards(JwtAuthGuard)
  async addDepartmentPrice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddDepartmentPriceDto,
    @Request() req
  ) {
    return this.serviceRequestService.addDepartmentPrice(id, dto.price, dto.note, req.user, dto.deptSlug);
  }

  // CHAT: Create or retrieve the chat room for a service request
  @Post(':id/chat')
  @UseGuards(JwtAuthGuard)
  async getOrCreateChat(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req
  ) {
    return this.serviceRequestService.getOrCreateChatRoom(id, req.user, this.chatService);
  }

  // NEW ENDPOINT: Chat with specific staff contributor
  @Post(':id/staff-chat/:staffId')
  @UseGuards(JwtAuthGuard)
  async getOrCreateStaffChat(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Request() req
  ) {
    return this.serviceRequestService.getOrCreateStaffChat(id, staffId, req.user, this.chatService);
  }

  // NEW ENDPOINT: Private chat for self (notes)
  @Post(':id/self-chat')
  @UseGuards(JwtAuthGuard)
  async getOrCreateSelfChat(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req
  ) {
    return this.serviceRequestService.getOrCreateSelfChat(id, req.user, this.chatService);
  }

  // NEW ENDPOINT: Accept a department's offer
  @Put(':id/accept-department-offer')
  @UseGuards(JwtAuthGuard)
  async acceptDepartmentOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { deptSlug: string },
    @Request() req
  ) {
    return this.serviceRequestService.acceptDepartmentOffer(id, body.deptSlug, req.user);
  }
  }

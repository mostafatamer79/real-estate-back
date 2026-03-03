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
    ParseUUIDPipe
  } from '@nestjs/common';
  import { ServiceRequestService } from './service-request.service';
  import { CreateServiceRequestDto ,UpdateServiceRequestDto} from './create-service-request.dto';

  import { RolesGuard } from '../common/guards/roles.guard';
  import { Roles } from '../common/decorators/roles.decorators';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { Role } from 'src/user/user-entity';

  @Controller('service-requests')
  export class ServiceRequestController {
    constructor(private readonly serviceRequestService: ServiceRequestService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles([Role.AGENT, Role.BROKER, Role.ADMIN])
    async create(@Body() createDto: CreateServiceRequestDto, @Request() req) {
      return this.serviceRequestService.create(createDto, req.user);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Request() req) {
      return this.serviceRequestService.findAll(req.user);
    }

    @Get('category/:category')

    async getByCategory(@Param('category') category: string) {
      return this.serviceRequestService.getByCategory(category);
    }

    @Get('statistics')


    async getStatistics() {
      return this.serviceRequestService.getStatistics();
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([Role.ADMIN])
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([Role.ADMIN, Role.LEGAL, Role.LEGAL_ADMIN])
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
  }
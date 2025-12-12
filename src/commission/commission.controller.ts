// src/commission/commission.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Query,
    Body,
    UseGuards,
    Request,
    ParseUUIDPipe
  } from '@nestjs/common';
  import { CommissionService } from './commission.service';
  import { CreateCommissionDto ,UpdateCommissionDto} from './create-commission.dto';
  import { RolesGuard } from '../common/guards/roles.guard';
  import { Roles } from '../common/decorators/roles.decorators';
  import { CommissionStatus, CommissionType } from './commission.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
  
  @Controller('commissions')
  @UseGuards(JwtAuthGuard)
  export class CommissionController {
    constructor(private readonly commissionService: CommissionService) {}
  
    @Post()
    async create(@Body() createDto: CreateCommissionDto, @Request() req) {
      return this.commissionService.create(createDto, req.user);
    }
  
    @Get()
    async findAll(
      @Request() req,
      @Query() query: {
        status?: CommissionStatus;
        type?: CommissionType;
        search?: string;
        startDate?: string;
        endDate?: string;
      }
    ) {
      const filters = {
        ...query,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      };
  
      return this.commissionService.findAll(req.user, filters);
    }
  
    @Get('stats')
    async getStatistics(@Request() req) {
      return this.commissionService.getStatistics(req.user);
    }
  
    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
      return this.commissionService.findOne(id, req.user);
    }
  
    @Put(':id')
    async update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateDto: UpdateCommissionDto,
      @Request() req
    ) {
      return this.commissionService.update(id, updateDto, req.user);
    }
  
    @Post(':id/submit')
    async submit(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
      return this.commissionService.submit(id, req.user);
    }
  
    @Delete(':id')
    async delete(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
      return this.commissionService.delete(id, req.user);
    }
  
    @Post(':id/attachments')
    async addAttachment(
      @Param('id', ParseUUIDPipe) id: string,
      @Body('fileUrl') fileUrl: string,
      @Request() req
    ) {
      return this.commissionService.addAttachment(id, fileUrl, req.user);
    }
  }
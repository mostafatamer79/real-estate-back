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
    async create(@Body() createDto: CreateServiceRequestDto, @Request() req) {
      return this.serviceRequestService.create(createDto, req.user);
    }
  
    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Request() req) {
      return this.serviceRequestService.findAll(req.user);
    }
  
    @Get('category/:category')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN,Role.AGENT)
    async getByCategory(@Param('category') category: string) {
      return this.serviceRequestService.getByCategory(category);
    }
  
    @Get('statistics')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN,Role.AGENT)

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
  }
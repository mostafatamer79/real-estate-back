import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { PropertyService } from './property.service';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { CreateTenantDto } from './dto/tenant.dto';
import { CreateLeaseDto, CreatePaymentDto } from './dto/lease.dto';
import { CreateMaintenanceRequestDto } from './dto/maintenance.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { Departments } from '../common/decorators/departments.decorators';
import { DepartmentsGuard } from '../common/guards/departments.guard';

@Controller('properties')
@UseGuards(JwtAuthGuard, DepartmentsGuard)
@Departments('properties')
export class PropertyController {
    constructor(private readonly propertyService: PropertyService) {}

    // Property Endpoints
    @Post()
    createProperty(@Body() createPropertyDto: CreatePropertyDto, @Request() req) {
        return this.propertyService.createProperty(createPropertyDto, req.user);
    }

    @Get()
    findAllProperties(@Request() req, @Query('ownerId') ownerId?: string) {
        return this.propertyService.findAllProperties(req.user, ownerId);
    }

    @Get('stats')
    getStats(
        @Request() req,
        @Query('ownerId') ownerId?: string,
        @Query('status') status?: string
    ) {
        return this.propertyService.getStats(req.user, ownerId, status);
    }

    @Get(':id')
    findOneProperty(@Param('id') id: string, @Request() req) {
        return this.propertyService.findOneProperty(id, req.user);
    }

    @Patch(':id')
    updateProperty(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto, @Request() req) {
        return this.propertyService.updateProperty(id, updatePropertyDto, req.user);
    }

    @Delete(':id')
    removeProperty(@Param('id') id: string, @Request() req) {
        return this.propertyService.removeProperty(id, req.user);
    }

    // Unit Endpoints
    @Post('units')
    createUnit(@Body() createUnitDto: CreateUnitDto, @Request() req) {
        return this.propertyService.createUnit(createUnitDto, req.user);
    }

    @Get(':id/units')
    getPropertyUnits(@Param('id') id: string, @Request() req) {
        return this.propertyService.findUnitsByProperty(id, req.user);
    }
    
    @Patch('units/:id')
    updateUnit(@Param('id') id: string, @Body() updateUnitDto: UpdateUnitDto, @Request() req) {
        return this.propertyService.updateUnit(id, updateUnitDto, req.user);
    }

    // Tenant Endpoints
    @Post('tenants')
    createTenant(@Body() createTenantDto: CreateTenantDto, @Request() req) {
        return this.propertyService.createTenant(createTenantDto, req.user);
    }

    @Get('tenants/all')
    async findAllTenants(@Request() req, @Query('ownerId') ownerId?: string) {
        return this.propertyService.findAllTenants(req.user, ownerId);
    }

    @Delete('tenants/:id')
    async removeTenant(@Param('id') id: string, @Request() req) {
        return this.propertyService.removeTenant(id, req.user);
    }

    @Patch('tenants/:id')
    async updateTenant(@Param('id') id: string, @Body() dto: Partial<CreateTenantDto>, @Request() req) {
        return this.propertyService.updateTenant(id, dto, req.user);
    }

    // Lease Endpoints
    @Post('leases')
    createLease(@Body() createLeaseDto: CreateLeaseDto, @Request() req) {
        return this.propertyService.createLease(createLeaseDto, req.user);
    }

    @Get('leases/all')
    findAllLeases(@Request() req, @Query('ownerId') ownerId?: string) {
        return this.propertyService.findAllLeases(req.user, ownerId);
    }

    @Patch('leases/:id')
    updateLease(@Param('id') id: string, @Body() dto: Partial<CreateLeaseDto>, @Request() req) {
        return this.propertyService.updateLease(id, dto, req.user);
    }

    @Delete('leases/:id')
    removeLease(@Param('id') id: string, @Request() req) {
        return this.propertyService.removeLease(id, req.user);
    }

    // Payment Endpoints
    @Post('payments')
    createPayment(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
        return this.propertyService.createPayment(createPaymentDto, req.user);
    }

    @Get('payments/all')
    findAllPayments(@Request() req, @Query('ownerId') ownerId?: string) {
        return this.propertyService.findAllPayments(req.user, ownerId);
    }

    @Patch('payments/:id')
    updatePayment(@Param('id') id: string, @Body() dto: Partial<CreatePaymentDto>, @Request() req) {
        return this.propertyService.updatePayment(id, dto, req.user);
    }

    @Delete('payments/:id')
    removePayment(@Param('id') id: string, @Request() req) {
        return this.propertyService.removePayment(id, req.user);
    }

    // Maintenance Endpoints
    @Post('maintenance')
    createMaintenance(@Body() createDto: CreateMaintenanceRequestDto, @Request() req) {
        return this.propertyService.createMaintenance(createDto, req.user);
    }

    @Get('maintenance/all')
    findAllMaintenance(@Request() req, @Query('ownerId') ownerId?: string) {
        return this.propertyService.findAllMaintenance(req.user, ownerId);
    }

    @Patch('maintenance/:id')
    updateMaintenance(@Param('id') id: string, @Body() dto: Partial<CreateMaintenanceRequestDto>, @Request() req) {
        return this.propertyService.updateMaintenance(id, dto, req.user);
    }

    @Delete('maintenance/:id')
    removeMaintenance(@Param('id') id: string, @Request() req) {
        return this.propertyService.removeMaintenance(id, req.user);
    }

}

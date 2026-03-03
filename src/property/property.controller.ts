import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PropertyService } from './property.service';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { CreateTenantDto } from './dto/tenant.dto';
import { CreateLeaseDto, CreatePaymentDto } from './dto/lease.dto';
import { CreateMaintenanceRequestDto } from './dto/maintenance.dto';
// import { JwtAuthGuard } from '../common/guards/jwt.guard';

@Controller('properties')
// @UseGuards(JwtAuthGuard) // Uncomment when Auth is fully integrated
export class PropertyController {
    constructor(private readonly propertyService: PropertyService) {}

    // Property Endpoints
    @Post()
    createProperty(@Body() createPropertyDto: CreatePropertyDto) {
        return this.propertyService.createProperty(createPropertyDto);
    }

    @Get()
    findAllProperties(@Query('ownerId') ownerId?: string) {
        return this.propertyService.findAllProperties(ownerId);
    }

    @Get(':id')
    findOneProperty(@Param('id') id: string) {
        return this.propertyService.findOneProperty(id);
    }

    @Patch(':id')
    updateProperty(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto) {
        return this.propertyService.updateProperty(id, updatePropertyDto);
    }

    @Delete(':id')
    removeProperty(@Param('id') id: string) {
        return this.propertyService.removeProperty(id);
    }

    // Unit Endpoints
    @Post('units')
    createUnit(@Body() createUnitDto: CreateUnitDto) {
        return this.propertyService.createUnit(createUnitDto);
    }

    @Get(':id/units')
    getPropertyUnits(@Param('id') id: string) {
        return this.propertyService.findUnitsByProperty(id);
    }
    
    @Patch('units/:id')
    updateUnit(@Param('id') id: string, @Body() updateUnitDto: UpdateUnitDto) {
        return this.propertyService.updateUnit(id, updateUnitDto);
    }

    // Tenant Endpoints
    @Post('tenants')
    createTenant(@Body() createTenantDto: CreateTenantDto) {
        return this.propertyService.createTenant(createTenantDto);
    }

    @Get('tenants/all')
    async findAllTenants() {
        return this.propertyService.findAllTenants();
    }

    @Delete('tenants/:id')
    async removeTenant(@Param('id') id: string) {
        return this.propertyService.removeTenant(id);
    }

    // Lease Endpoints
    @Post('leases')
    createLease(@Body() createLeaseDto: CreateLeaseDto) {
        return this.propertyService.createLease(createLeaseDto);
    }

    @Get('leases/all')
    findAllLeases() {
        return this.propertyService.findAllLeases();
    }

    // Payment Endpoints
    @Post('payments')
    createPayment(@Body() createPaymentDto: CreatePaymentDto) {
        return this.propertyService.createPayment(createPaymentDto);
    }

    @Get('payments/all')
    findAllPayments() {
        return this.propertyService.findAllPayments();
    }

    // Maintenance Endpoints
    @Post('maintenance')
    createMaintenance(@Body() createDto: CreateMaintenanceRequestDto) {
        return this.propertyService.createMaintenance(createDto);
    }

    @Get('maintenance/all')
    findAllMaintenance() {
        return this.propertyService.findAllMaintenance();
    }

    @Get('stats')
    getStats(
        @Query('ownerId') ownerId?: string,
        @Query('status') status?: string
    ) {
        return this.propertyService.getStats(ownerId, status);
    }
}

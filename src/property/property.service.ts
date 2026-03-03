import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { Unit } from './entities/unit.entity';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { CreateTenantDto } from './dto/tenant.dto';
import { TenantProfile } from './entities/tenant-profile.entity';
import { Lease } from './entities/lease.entity';
import { Payment } from './entities/payment.entity';
import { MaintenanceRequest } from './entities/maintenance-request.entity';
import { CreateLeaseDto, CreatePaymentDto } from './dto/lease.dto';
import { CreateMaintenanceRequestDto } from './dto/maintenance.dto';

@Injectable()
export class PropertyService {
    constructor(
        @InjectRepository(Property)
        private propertyRepository: Repository<Property>,
        @InjectRepository(Unit)
        private unitRepository: Repository<Unit>,
        @InjectRepository(TenantProfile)
        private tenantRepository: Repository<TenantProfile>,
        @InjectRepository(Lease)
        private leaseRepository: Repository<Lease>,
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        @InjectRepository(MaintenanceRequest)
        private maintenanceRepository: Repository<MaintenanceRequest>,
    ) {}

    // Property Methods
    async createProperty(createPropertyDto: CreatePropertyDto): Promise<Property> {
        const property = this.propertyRepository.create(createPropertyDto);
        return await this.propertyRepository.save(property);
    }

    async findAllProperties(ownerId?: string): Promise<Property[]> {
        const query = this.propertyRepository.createQueryBuilder('property')
            .leftJoinAndSelect('property.units', 'units');
        
        if (ownerId) {
            query.where('property.ownerId = :ownerId', { ownerId });
        }
        
        return await query.getMany();
    }

    async findOneProperty(id: string): Promise<Property> {
        const property = await this.propertyRepository.findOne({ 
            where: { id },
            relations: ['units'] 
        });
        if (!property) throw new NotFoundException(`Property with ID ${id} not found`);
        return property;
    }

    async updateProperty(id: string, updatePropertyDto: UpdatePropertyDto): Promise<Property> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { units, ...updateData } = updatePropertyDto;
        await this.propertyRepository.update(id, updateData);
        return this.findOneProperty(id);
    }

    async removeProperty(id: string): Promise<void> {
        const result = await this.propertyRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // Unit Methods
    async createUnit(createUnitDto: CreateUnitDto): Promise<Unit> {
        const unit = this.unitRepository.create(createUnitDto);
        return await this.unitRepository.save(unit);
    }

    async findUnitsByProperty(propertyId: string): Promise<Unit[]> {
        return await this.unitRepository.find({ where: { propertyId } });
    }

    async updateUnit(id: string, updateUnitDto: UpdateUnitDto): Promise<Unit> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { leases, ...updateData } = updateUnitDto;
        await this.unitRepository.update(id, updateData);
        const unit = await this.unitRepository.findOne({ where: { id } });
        if (!unit) throw new NotFoundException(`Unit with ID ${id} not found`);
        return unit;
    }
    
    async removeUnit(id: string): Promise<void> {
        await this.unitRepository.delete(id);
    }

    // Tenant Methods
    async createTenant(createTenantDto: CreateTenantDto): Promise<TenantProfile> {
        const tenant = this.tenantRepository.create(createTenantDto);
        return await this.tenantRepository.save(tenant);
    }

    async findAllTenants(): Promise<TenantProfile[]> {
        return await this.tenantRepository.find();
    }

    async removeTenant(id: string): Promise<void> {
        const result = await this.tenantRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Lease Methods
    async createLease(createLeaseDto: CreateLeaseDto): Promise<Lease> {
        const lease = this.leaseRepository.create(createLeaseDto);
        return await this.leaseRepository.save(lease);
    }

    async findAllLeases(): Promise<Lease[]> {
        return await this.leaseRepository.find({ relations: ['unit', 'tenant', 'unit.property'] });
    }

    // Payment Methods
    async createPayment(createPaymentDto: CreatePaymentDto): Promise<any> {
        const payment = this.paymentRepository.create(createPaymentDto as any);
        return await this.paymentRepository.save(payment);
    }

    async findAllPayments(): Promise<Payment[]> {
        return await this.paymentRepository.find({ relations: ['lease', 'lease.tenant', 'lease.unit', 'lease.unit.property'] });
    }

    // Maintenance Methods
    async createMaintenance(createDto: CreateMaintenanceRequestDto): Promise<MaintenanceRequest> {
        const request = this.maintenanceRepository.create(createDto);
        return await this.maintenanceRepository.save(request);
    }

    async findAllMaintenance(): Promise<MaintenanceRequest[]> {
        return await this.maintenanceRepository.find({
            relations: ['property', 'unit'],
            order: { createdAt: 'DESC' }
        });
    }

    async getStats(ownerId?: string, status?: string) {
        const query = this.propertyRepository.createQueryBuilder('property');
        
        if (ownerId) {
            query.where('property.ownerId = :ownerId', { ownerId });
        }
        
        if (status && status !== 'ALL') {
             // In property context, status might be 'vacant', 'rented', etc.
             // But for analytics, user might want to filter by recent deals or similar.
             // For now, we'll map status to property.status if applicable.
             query.andWhere('property.status = :status', { status: status.toLowerCase() });
        }

        const properties = await query.getMany();
        
        const counts: Record<string, number> = {};
        for (const p of properties) {
            counts[p.type] = (counts[p.type] || 0) + 1;
        }

        return Object.entries(counts).map(([name, value]) => ({
            name,
            value
        }));
    }
}

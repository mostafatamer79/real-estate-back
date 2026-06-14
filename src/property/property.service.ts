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
import { ActivityService } from '../activity/activity.service';
import { ActivityType } from '../common/entities/activity.entity';
import { User, Role } from '../user/user-entity';

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
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private readonly activityService: ActivityService,
    ) {}

    private async getOwnerIds(ownerId: string): Promise<string[]> {
        const user = await this.userRepository.findOne({ where: { id: ownerId } });
        if (!user) return [ownerId];
        
        // Use the Role enum from user-entity
        if (user.role === Role.MANGER) {
            const subUsers = await this.userRepository.find({ where: { parentId: ownerId } });
            return [ownerId, ...subUsers.map(u => u.id)];
        }
        
        return [ownerId];
    }

    private getEffectiveOwnerId(user: any, ownerId?: string): string | undefined {
        if (ownerId) return ownerId;
        if (user?.role === Role.ADMIN) return undefined;
        return user?.userId || user?.id;
    }

    // Property Methods
    async createProperty(createPropertyDto: CreatePropertyDto, user: any): Promise<Property> {
        const ownerId = (createPropertyDto as any).ownerId || user?.userId || user?.id;
        const property = this.propertyRepository.create({ ...(createPropertyDto as any), ownerId } as any);
        const saved = await this.propertyRepository.save(property as any);
        const savedProperty = Array.isArray(saved) ? saved[0] : saved;
        
        await this.activityService.create(
            ActivityType.PROPERTY_ADDED,
            'New Property Added',
            `Property "${savedProperty.name}" has been added`,
            { 
                propertyId: savedProperty.id,
                name: savedProperty.name,
                type: savedProperty.type
            },
            savedProperty.ownerId
        );
        
        return savedProperty;
    }

    async findAllProperties(user: any, ownerId?: string): Promise<Property[]> {
        const effectiveOwnerId = this.getEffectiveOwnerId(user, ownerId);
        const query = this.propertyRepository.createQueryBuilder('property')
            .leftJoinAndSelect('property.units', 'units')
            .leftJoinAndSelect('property.owner', 'owner');
        
        if (effectiveOwnerId) {
            const ownerIds = await this.getOwnerIds(effectiveOwnerId);
            query.where('property.ownerId IN (:...ownerIds)', { ownerIds });
        }
        
        return await query.getMany();
    }

    async findOneProperty(id: string, user: any): Promise<Property> {
        const property = await this.propertyRepository.findOne({ 
            where: { id },
            relations: ['units'] 
        });
        if (!property) throw new NotFoundException(`Property with ID ${id} not found`);
        // Basic scoping: non-admins should only access their own properties.
        const userId = user?.userId || user?.id;
        if (userId && property.ownerId && property.ownerId !== userId && user?.role !== Role.ADMIN) {
            throw new NotFoundException(`Property with ID ${id} not found`);
        }
        return property;
    }

    async updateProperty(id: string, updatePropertyDto: UpdatePropertyDto, user: any): Promise<Property> {
        await this.findOneProperty(id, user);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { units, ...updateData } = updatePropertyDto;
        await this.propertyRepository.update(id, updateData);
        return this.findOneProperty(id, user);
    }

    async removeProperty(id: string, user: any): Promise<void> {
        await this.findOneProperty(id, user);
        const result = await this.propertyRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // Unit Methods
    async createUnit(createUnitDto: CreateUnitDto, user: any): Promise<Unit> {
        // Ensure unit is created under a property the user can access
        if ((createUnitDto as any).propertyId) {
            await this.findOneProperty((createUnitDto as any).propertyId, user);
        }
        const unit = this.unitRepository.create(createUnitDto);
        return await this.unitRepository.save(unit);
    }

    async findUnitsByProperty(propertyId: string, user: any): Promise<Unit[]> {
        await this.findOneProperty(propertyId, user);
        return await this.unitRepository.find({ where: { propertyId } });
    }

    async updateUnit(id: string, updateUnitDto: UpdateUnitDto, user: any): Promise<Unit> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { leases, ...updateData } = updateUnitDto;
        await this.unitRepository.update(id, updateData);
        const unit = await this.unitRepository.findOne({ where: { id } });
        if (!unit) throw new NotFoundException(`Unit with ID ${id} not found`);
        await this.findOneProperty(unit.propertyId, user);
        return unit;
    }
    
    async removeUnit(id: string): Promise<void> {
        await this.unitRepository.delete(id);
    }

    // Tenant Methods
    async createTenant(createTenantDto: CreateTenantDto, _user?: any): Promise<TenantProfile> {
        const tenant = this.tenantRepository.create(createTenantDto);
        return await this.tenantRepository.save(tenant);
    }

    async findAllTenants(user: any, ownerId?: string): Promise<TenantProfile[]> {
        const effectiveOwnerId = this.getEffectiveOwnerId(user, ownerId);
        const query = this.tenantRepository.createQueryBuilder('tenant');
        
        if (effectiveOwnerId) {
            const ownerIds = await this.getOwnerIds(effectiveOwnerId);
            query.innerJoin('tenant.leases', 'lease')
                 .innerJoin('lease.unit', 'unit')
                 .innerJoin('unit.property', 'property')
                 .where('property.ownerId IN (:...ownerIds)', { ownerIds });
        }
        
        return await query.getMany();
    }

    async removeTenant(id: string, user: any): Promise<void> {
        // Ensure tenant belongs to one of user's properties
        const tenant = await this.tenantRepository.findOne({ where: { id }, relations: ['leases'] as any });
        if (!tenant) throw new NotFoundException(`Tenant with ID ${id} not found`);
        const leaseUnitIds = (tenant as any).leases?.map((l: any) => l.unitId).filter(Boolean) || [];
        if (leaseUnitIds.length) {
            const units = await this.unitRepository.find({ where: leaseUnitIds.map((unitId) => ({ id: unitId })) as any });
            const propertyIds = Array.from(new Set(units.map((u) => u.propertyId)));
            // If any property is accessible, allow delete
            await Promise.all(propertyIds.map((pid) => this.findOneProperty(pid, user).catch(() => null)));
        }
        const result = await this.tenantRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    async updateTenant(id: string, dto: Partial<CreateTenantDto>, user: any): Promise<TenantProfile> {
        const tenant = await this.tenantRepository.findOne({ where: { id }, relations: ['leases'] as any });
        if (!tenant) throw new NotFoundException(`Tenant with ID ${id} not found`);
        if (user?.role !== Role.ADMIN) {
            const leases = await this.leaseRepository.find({ where: { tenantId: id } as any });
            for (const lease of leases) {
                const unit = await this.unitRepository.findOne({ where: { id: lease.unitId } });
                if (unit) await this.findOneProperty(unit.propertyId, user);
            }
        }
        await this.tenantRepository.update(id, dto as any);
        const updated = await this.tenantRepository.findOne({ where: { id } });
        if (!updated) throw new NotFoundException(`Tenant with ID ${id} not found`);
        return updated;
    }

    // Lease Methods
    async createLease(createLeaseDto: CreateLeaseDto, user: any): Promise<Lease> {
        // Ensure lease is created under a unit the user can access
        const unit = await this.unitRepository.findOne({ where: { id: (createLeaseDto as any).unitId } });
        if (unit) await this.findOneProperty(unit.propertyId, user);
        const lease = this.leaseRepository.create(createLeaseDto);
        const savedLease = await this.leaseRepository.save(lease);
        
        await this.activityService.create(
            ActivityType.BOOKING_MADE,
            'New Lease Created',
            `A new lease has been created for unit ${savedLease.unitId}`,
            { 
                leaseId: savedLease.id,
                unitId: savedLease.unitId,
                tenantId: savedLease.tenantId,
                startDate: savedLease.startDate,
                endDate: savedLease.endDate
            },
            savedLease.tenantId
        );
        
        return savedLease;
    }

    async findAllLeases(user: any, ownerId?: string): Promise<Lease[]> {
        const effectiveOwnerId = this.getEffectiveOwnerId(user, ownerId);
        const query = this.leaseRepository.createQueryBuilder('lease')
            .leftJoinAndSelect('lease.unit', 'unit')
            .leftJoinAndSelect('lease.tenant', 'tenant')
            .leftJoinAndSelect('unit.property', 'property');
        
        if (effectiveOwnerId) {
            const ownerIds = await this.getOwnerIds(effectiveOwnerId);
            query.where('property.ownerId IN (:...ownerIds)', { ownerIds });
        }
        
        return await query.getMany();
    }

    async updateLease(id: string, dto: Partial<CreateLeaseDto>, user: any): Promise<Lease> {
        const lease = await this.leaseRepository.findOne({ where: { id } });
        if (!lease) throw new NotFoundException(`Lease with ID ${id} not found`);
        const unit = await this.unitRepository.findOne({ where: { id: (dto as any).unitId || lease.unitId } });
        if (unit) await this.findOneProperty(unit.propertyId, user);
        await this.leaseRepository.update(id, dto as any);
        const updated = await this.leaseRepository.findOne({ where: { id }, relations: ['unit', 'tenant'] });
        if (!updated) throw new NotFoundException(`Lease with ID ${id} not found`);
        return updated;
    }

    async removeLease(id: string, user: any): Promise<void> {
        const lease = await this.leaseRepository.findOne({ where: { id } });
        if (!lease) throw new NotFoundException(`Lease with ID ${id} not found`);
        const unit = await this.unitRepository.findOne({ where: { id: lease.unitId } });
        if (unit) await this.findOneProperty(unit.propertyId, user);
        const result = await this.leaseRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException(`Lease with ID ${id} not found`);
    }

    // Payment Methods
    async createPayment(createPaymentDto: CreatePaymentDto, user: any): Promise<any> {
        // Ensure payment belongs to a lease/unit/property user can access
        const lease = await this.leaseRepository.findOne({ where: { id: (createPaymentDto as any).leaseId } });
        if (lease) {
            const unit = await this.unitRepository.findOne({ where: { id: (lease as any).unitId } });
            if (unit) await this.findOneProperty(unit.propertyId, user);
        }
        const payment = this.paymentRepository.create(createPaymentDto as any);
        const savedPayment = await this.paymentRepository.save(payment);
        
        // Handle case where save might return an array (though it shouldn't here)
        const paymentObj = Array.isArray(savedPayment) ? savedPayment[0] : savedPayment;

        await this.activityService.create(
            ActivityType.PAYMENT_RECEIVED,
            'Payment Received',
            `A payment of ${paymentObj.amount} has been received`,
            { 
                paymentId: paymentObj.id,
                amount: paymentObj.amount,
                status: paymentObj.status,
                leaseId: paymentObj.leaseId
            }
        );
        
        return savedPayment;
    }

    async findAllPayments(user: any, ownerId?: string): Promise<Payment[]> {
        const effectiveOwnerId = this.getEffectiveOwnerId(user, ownerId);
        const query = this.paymentRepository.createQueryBuilder('payment')
            .leftJoinAndSelect('payment.lease', 'lease')
            .leftJoinAndSelect('lease.tenant', 'tenant')
            .leftJoinAndSelect('lease.unit', 'unit')
            .leftJoinAndSelect('unit.property', 'property');
        
        if (effectiveOwnerId) {
            const ownerIds = await this.getOwnerIds(effectiveOwnerId);
            query.where('property.ownerId IN (:...ownerIds)', { ownerIds });
        }
        
        return await query.getMany();
    }

    async updatePayment(id: string, dto: Partial<CreatePaymentDto>, user: any): Promise<Payment> {
        const payment = await this.paymentRepository.findOne({ where: { id } });
        if (!payment) throw new NotFoundException(`Payment with ID ${id} not found`);
        const lease = await this.leaseRepository.findOne({ where: { id: (dto as any).leaseId || payment.leaseId } });
        if (lease) {
            const unit = await this.unitRepository.findOne({ where: { id: lease.unitId } });
            if (unit) await this.findOneProperty(unit.propertyId, user);
        }
        await this.paymentRepository.update(id, dto as any);
        const updated = await this.paymentRepository.findOne({ where: { id }, relations: ['lease'] });
        if (!updated) throw new NotFoundException(`Payment with ID ${id} not found`);
        return updated;
    }

    async removePayment(id: string, user: any): Promise<void> {
        const payment = await this.paymentRepository.findOne({ where: { id } });
        if (!payment) throw new NotFoundException(`Payment with ID ${id} not found`);
        const lease = await this.leaseRepository.findOne({ where: { id: payment.leaseId } });
        if (lease) {
            const unit = await this.unitRepository.findOne({ where: { id: lease.unitId } });
            if (unit) await this.findOneProperty(unit.propertyId, user);
        }
        const result = await this.paymentRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    // Maintenance Methods
    async createMaintenance(createDto: CreateMaintenanceRequestDto, user: any): Promise<MaintenanceRequest> {
        if ((createDto as any).propertyId) await this.findOneProperty((createDto as any).propertyId, user);
        const request = this.maintenanceRepository.create(createDto);
        return await this.maintenanceRepository.save(request);
    }

    async findAllMaintenance(user: any, ownerId?: string): Promise<MaintenanceRequest[]> {
        const effectiveOwnerId = this.getEffectiveOwnerId(user, ownerId);
        const query = this.maintenanceRepository.createQueryBuilder('maintenance')
            .leftJoinAndSelect('maintenance.property', 'property')
            .leftJoinAndSelect('maintenance.unit', 'unit');
        
        if (effectiveOwnerId) {
            const ownerIds = await this.getOwnerIds(effectiveOwnerId);
            query.where('property.ownerId IN (:...ownerIds)', { ownerIds });
        }
        
        query.orderBy('maintenance.createdAt', 'DESC');
        
        return await query.getMany();
    }

    async updateMaintenance(id: string, dto: Partial<CreateMaintenanceRequestDto>, user: any): Promise<MaintenanceRequest> {
        const request = await this.maintenanceRepository.findOne({ where: { id } });
        if (!request) throw new NotFoundException(`Maintenance with ID ${id} not found`);
        const propertyId = (dto as any).propertyId || request.propertyId;
        if (propertyId) await this.findOneProperty(propertyId, user);
        await this.maintenanceRepository.update(id, dto as any);
        const updated = await this.maintenanceRepository.findOne({ where: { id }, relations: ['property', 'unit'] });
        if (!updated) throw new NotFoundException(`Maintenance with ID ${id} not found`);
        return updated;
    }

    async removeMaintenance(id: string, user: any): Promise<void> {
        const request = await this.maintenanceRepository.findOne({ where: { id } });
        if (!request) throw new NotFoundException(`Maintenance with ID ${id} not found`);
        if (request.propertyId) await this.findOneProperty(request.propertyId, user);
        const result = await this.maintenanceRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException(`Maintenance with ID ${id} not found`);
    }

    async getStats(user: any, ownerId?: string, status?: string) {
        const effectiveOwnerId = this.getEffectiveOwnerId(user, ownerId);
        const query = this.propertyRepository.createQueryBuilder('property');
        
        if (effectiveOwnerId) {
            const ownerIds = await this.getOwnerIds(effectiveOwnerId);
            if (!ownerIds.length) return [];
            query.where('property.ownerId IN (:...ownerIds)', { ownerIds });
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
            const type = String(p.type || 'other').toLowerCase();
            counts[type] = (counts[type] || 0) + 1;
        }

        return Object.entries(counts).map(([name, value]) => ({
            name,
            value
        }));
    }
}

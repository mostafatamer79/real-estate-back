import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';
import { Property } from './entities/property.entity';
import { Unit } from './entities/unit.entity';
import { TenantProfile } from './entities/tenant-profile.entity';
import { Lease } from './entities/lease.entity';
import { Payment } from './entities/payment.entity';
import { UtilityBill } from './entities/utility-bill.entity';
import { MaintenanceRequest } from './entities/maintenance-request.entity';
import { Expense } from './entities/expense.entity';
import { UserModule } from '../user/user.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Property, 
            Unit, 
            TenantProfile, 
            Lease, 
            Payment, 
            UtilityBill, 
            MaintenanceRequest,
            Expense
        ]),
        UserModule
    ],
    controllers: [PropertyController], // Add other controllers as created
    providers: [PropertyService], // Add other services as created
    exports: [PropertyService]
})
export class PropertyModule {}

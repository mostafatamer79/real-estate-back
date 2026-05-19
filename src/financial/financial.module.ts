import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialService } from './financial.service';
import { FinancialController } from './financial.controller';
import { FinancialTransaction } from './entities/financial-transaction.entity';
import { Invoice } from './entities/invoice.entity';
import { Commission } from '../commission/commission.entity';
import { User } from '../user/user-entity';
import { Booking } from '../booking/entities/booking.entity';
import { ServiceRequest } from '../service/service-request.entity';
import { DepartmentsGuard } from '../common/guards/departments.guard';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([FinancialTransaction, Invoice, Commission, User, Booking, ServiceRequest]), SettingsModule],
  controllers: [FinancialController],
  providers: [FinancialService, DepartmentsGuard],
  exports: [FinancialService],
})
export class FinancialModule {}

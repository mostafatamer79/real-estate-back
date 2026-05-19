// src/commission/commission.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commission } from './commission.entity';
import { CommissionService } from './commission.service';
import { CommissionController } from './commission.controller';
import { FinancialModule } from '../financial/financial.module';
import { DepartmentsGuard } from '../common/guards/departments.guard';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Commission]),
    forwardRef(() => FinancialModule),
    SettingsModule,
  ],
  controllers: [CommissionController],
  providers: [CommissionService, DepartmentsGuard],
  exports: [CommissionService]
})
export class CommissionModule {}

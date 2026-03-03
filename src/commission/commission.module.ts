// src/commission/commission.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commission } from './commission.entity';
import { CommissionService } from './commission.service';
import { CommissionController } from './commission.controller';
import { FinancialModule } from '../financial/financial.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Commission]),
    forwardRef(() => FinancialModule),
  ],
  controllers: [CommissionController],
  providers: [CommissionService],
  exports: [CommissionService]
})
export class CommissionModule {}
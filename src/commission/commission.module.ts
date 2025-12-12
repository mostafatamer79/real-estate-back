// src/commission/commission.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commission } from './commission.entity';
import { CommissionService } from './commission.service';
import { CommissionController } from './commission.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Commission])],
  controllers: [CommissionController],
  providers: [CommissionService],
  exports: [CommissionService]
})
export class CommissionModule {}
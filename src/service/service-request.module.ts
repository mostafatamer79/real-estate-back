// src/service-request/service-request.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequest } from './service-request.entity';
import { ServiceRequestService } from './service-request.service';
import { ServiceRequestController } from './service-request.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceRequest])],
  controllers: [ServiceRequestController],
  providers: [ServiceRequestService],
  exports: [ServiceRequestService]
})
export class ServiceRequestModule {}
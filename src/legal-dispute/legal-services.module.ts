// legal-services.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalServicesService } from './legal-services.service';

import { User } from '../user/user-entity';
import { Contract } from './contract.entity';
import { LegalServicesController } from './legal-dispute.controller';
import { LegalDispute } from './legal-dispute.entity';
import { LegalDocumentation } from './legal-documentation.entity';
import { OtherLegalService } from './other-legal-services.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LegalDispute,
      Contract,
      LegalDocumentation,
      OtherLegalService,
      User
    ])
  ],
  controllers: [LegalServicesController],
  providers: [LegalServicesService],
  exports: [LegalServicesService]
})
export class LegalServicesModule {}
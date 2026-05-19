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
import { DepartmentsGuard } from '../common/guards/departments.guard';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LegalDispute,
      Contract,
      LegalDocumentation,
      OtherLegalService,
      User
    ]),
    SettingsModule,
  ],
  controllers: [LegalServicesController],
  providers: [LegalServicesService, DepartmentsGuard],
  exports: [LegalServicesService]
})
export class LegalServicesModule {}

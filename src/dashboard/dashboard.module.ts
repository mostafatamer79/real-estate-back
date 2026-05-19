import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsModule } from '../settings/settings.module';
import { User } from '../user/user-entity';
import { Property } from '../property/entities/property.entity';
import { Offer } from '../offer/offer-entity';
import { Order } from '../order/entities/order.entity';
import { MarketingRequest } from '../marketing/entities/marketing-request.entity';
import { LegalDispute } from '../legal-dispute/legal-dispute.entity';
import { Contract } from '../legal-dispute/contract.entity';
import { LegalDocumentation } from '../legal-dispute/legal-documentation.entity';
import { Invoice } from '../financial/entities/invoice.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    SettingsModule,
    TypeOrmModule.forFeature([
      User,
      Property,
      Offer,
      Order,
      MarketingRequest,
      LegalDispute,
      Contract,
      LegalDocumentation,
      Invoice,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}


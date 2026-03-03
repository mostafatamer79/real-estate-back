import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { Offer } from './offer-entity';
import { PurchaseRequest } from './entities/purchase-request.entity';
import { VisitRequest } from './entities/visit-request.entity';
import { Invoice } from '../financial/entities/invoice.entity';
import { OfferView } from './entities/offer-view.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer, PurchaseRequest, VisitRequest, Invoice, OfferView]),
    SettingsModule,
  ],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
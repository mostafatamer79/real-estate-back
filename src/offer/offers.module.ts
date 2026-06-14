import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { Offer } from './offer-entity';
import { PurchaseRequest } from './entities/purchase-request.entity';
import { VisitRequest } from './entities/visit-request.entity';
import { Invoice } from '../financial/entities/invoice.entity';
import { OfferView } from './entities/offer-view.entity';
import { OfferReport } from './entities/offer-report.entity';
import { SettingsModule } from '../settings/settings.module';
import { User } from '../user/user-entity';
import { UserModule } from '../user/user.module';
import { DepartmentsGuard } from '../common/guards/departments.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer, PurchaseRequest, VisitRequest, Invoice, OfferView, OfferReport, User]),
    SettingsModule,
    UserModule,
  ],
  controllers: [OffersController],
  providers: [OffersService, DepartmentsGuard],
  exports: [OffersService],
})
export class OffersModule {}

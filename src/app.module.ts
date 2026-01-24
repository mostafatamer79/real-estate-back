import { Module } from '@nestjs/common';
import { MailModule } from './mail/mail.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { typeOrmConfig } from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { authConfig, AuthConfig } from './config/auth.config';
import { AuthService } from './auth/auth.service';
import { PasswordService } from './password/password.service';
import { AuthModule } from './auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { UserModule } from './user/user.module';
import { ServiceRequestModule } from './service/service-request.module';
import { DocumentModule } from './document/document.module';
import { CommissionModule } from './commission/commission.module';
import { OffersModule } from './offer/offers.module';
import { ChatModule } from './chat/chat.module';
import { PlacesModule } from './place/place.module';
import { LegalServicesModule } from './legal-dispute/legal-services.module';
import { SettingsModule } from './settings/settings.module';
import { OrderModule } from './order/order.module';
import { BookingModule } from './booking/booking.module';
import { PaymentModule } from './payment/payment.module';
import { MarketingModule } from './marketing/marketing.module';
import { FinancialModule } from './financial/financial.module';
import { HomeModule } from './home/home.module';

@Module({
  imports: [    ConfigModule.forRoot({ load: [ typeOrmConfig,authConfig], isGlobal: true }),
  TypeOrmModule.forRoot(typeOrmConfig()),    AuthModule,UserModule,ServiceRequestModule,DocumentModule,CommissionModule,OffersModule,ChatModule,PlacesModule,LegalServicesModule, SettingsModule, OrderModule, BookingModule, PaymentModule, MarketingModule, FinancialModule, HomeModule,
  MailModule
],

  controllers: [AppController],
  providers: [AppService]

})
export class AppModule {}

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
import { NotificationModule } from './notification/notification.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ManagementPackageModule } from './subscription/management-package/management-package.module';
import { PropertyModule } from './property/property.module';
import { ActivityModule } from './activity/activity.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CustomerServiceFaqModule } from './customer-service-faq/customer-service-faq.module';
import { CustomerServiceFeedbackModule } from './customer-service-feedback/customer-service-feedback.module';
import { InfoContentModule } from './info-content/info-content.module';
import { OpinionModule } from './opinion/opinion.module';
import { Activity } from './common/entities/activity.entity';
import { SeederService } from './seeders/seeder.service';
import { User, Permission } from './user/user-entity';
import { Property } from './property/entities/property.entity';
import { FinancialTransaction } from './financial/entities/financial-transaction.entity';

// ── Global Guards ──────────────────────────────────────────────────────────────
import { Reflector, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { DepartmentsGuard } from './common/guards/departments.guard';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { DebugInterceptor } from './common/interceptors/debug.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [typeOrmConfig, authConfig], isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig()),
    TypeOrmModule.forFeature([User, Permission, Activity, Property, FinancialTransaction]),
    AuthModule, UserModule, ServiceRequestModule, DocumentModule, CommissionModule,
    OffersModule, ChatModule, PlacesModule, LegalServicesModule, SettingsModule,
    OrderModule, BookingModule, PaymentModule, MarketingModule, FinancialModule,
    HomeModule, NotificationModule, PropertyModule, SubscriptionModule,
    ManagementPackageModule, ActivityModule,
    MailModule,
    DashboardModule,
    CustomerServiceFaqModule,
    CustomerServiceFeedbackModule,
    InfoContentModule,
    OpinionModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    SeederService,

    { provide: APP_INTERCEPTOR, useClass: DebugInterceptor },

    // ── Global guards ──────────────────────────────────────────────────────
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: DepartmentsGuard },
    { provide: APP_GUARD, useClass: SubscriptionGuard },
  ],
})
export class AppModule {}

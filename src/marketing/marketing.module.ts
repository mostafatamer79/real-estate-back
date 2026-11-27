import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { MarketingService } from './marketing.service';
import { MarketingController } from './marketing.controller';
import { MarketingRequest } from './entities/marketing-request.entity';
import { PhotographerProfile } from './entities/photographer-profile.entity';
import { MarketingCampaign } from './entities/marketing-campaign.entity';
import { EmailMarketing } from './entities/email-marketing.entity';
import { SocialMediaService } from './social-media.service';
import { MarketingCronService } from './marketing-cron.service';
import { MailModule } from '../mail/mail.module';
import { NotificationModule } from '../notification/notification.module';
import { User } from '../user/user-entity';
import { DepartmentsGuard } from '../common/guards/departments.guard';
import { SettingsModule } from '../settings/settings.module';
import { DocumentModule } from '../document/document.module';
import { Invoice } from '../financial/entities/invoice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketingRequest,
      PhotographerProfile,
      MarketingCampaign,
      EmailMarketing,
      User,
      Invoice,
    ]),
    MailModule,
    NotificationModule,
    ScheduleModule.forRoot(),
    SettingsModule,
    DocumentModule,
  ],
  controllers: [MarketingController],
  providers: [MarketingService, SocialMediaService, MarketingCronService, DepartmentsGuard],
  exports: [MarketingService, SocialMediaService],
})
export class MarketingModule {}

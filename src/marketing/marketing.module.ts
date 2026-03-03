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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketingRequest,
      PhotographerProfile,
      MarketingCampaign,
      EmailMarketing,
      User,
    ]),
    MailModule,
    NotificationModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [MarketingController],
  providers: [MarketingService, SocialMediaService, MarketingCronService],
  exports: [MarketingService, SocialMediaService],
})
export class MarketingModule {}

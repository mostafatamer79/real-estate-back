import { Module } from '@nestjs/common';
import { WipeController } from './wipe.controller';
import { WipeService } from './wipe.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [WipeController],
  providers: [WipeService],
  exports: [WipeService],
})
export class WipeModule {}

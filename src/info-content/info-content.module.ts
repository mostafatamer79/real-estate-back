import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfoTab } from './entities/info-tab.entity';
import { InfoBlock } from './entities/info-block.entity';
import { InfoContentService } from './info-content.service';
import { InfoContentController } from './info-content.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InfoTab, InfoBlock])],
  providers: [InfoContentService],
  controllers: [InfoContentController],
})
export class InfoContentModule {}


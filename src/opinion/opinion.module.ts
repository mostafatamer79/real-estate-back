import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpinionService } from './opinion.service';
import { OpinionController } from './opinion.controller';
import { Opinion } from './entities/opinion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Opinion])],
  controllers: [OpinionController],
  providers: [OpinionService],
})
export class OpinionModule {}

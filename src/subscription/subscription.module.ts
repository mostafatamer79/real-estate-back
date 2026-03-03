import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { Subscription } from './subscription.entity';
import { User } from '../user/user-entity';
import { Property } from '../property/entities/property.entity';
import { Unit } from '../property/entities/unit.entity';

import { ManagementPackageModule } from './management-package/management-package.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, User, Property, Unit]),
    ManagementPackageModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}

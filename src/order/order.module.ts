import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './entities/order.entity';
import { User } from '../user/user-entity';
import { NotificationModule } from '../notification/notification.module';
import { DepartmentsGuard } from '../common/guards/departments.guard';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, User]), NotificationModule, SettingsModule],
  controllers: [OrderController],
  providers: [OrderService, DepartmentsGuard],
  exports: [OrderService],
})
export class OrderModule {}

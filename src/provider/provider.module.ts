import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../user/user-entity";
import { ServiceRequest } from "../service/service-request.entity";
import { Invoice } from "../financial/entities/invoice.entity";
import { SettingsModule } from "../settings/settings.module";
import { NotificationModule } from "../notification/notification.module";
import { ProviderService } from "./provider.service";
import { ProviderController } from "./provider.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ServiceRequest, Invoice]),
    SettingsModule,
    NotificationModule,
  ],
  controllers: [ProviderController],
  providers: [ProviderService],
})
export class ProviderModule {}

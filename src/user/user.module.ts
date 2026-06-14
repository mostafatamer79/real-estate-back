import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission, User } from './user-entity';
import { JwtModule } from '@nestjs/jwt';
import { authConfig } from '../config/auth.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { PasswordService } from '../password/password.service';
import { UserController } from './user.controller';
import { DocumentModule } from '../document/document.module';
import { AuthModule } from '../auth/auth.module';
import { Offer } from '../offer/offer-entity';
import { ServiceRequest } from '../service/service-request.entity';
import { Activity } from '../common/entities/activity.entity';
import { ChatRoom, Message } from '../chat/message.entity';
import { Booking } from '../booking/entities/booking.entity';
import { Order } from '../order/entities/order.entity';
import { Invoice } from '../financial/entities/invoice.entity';
import { Commission } from '../commission/commission.entity';
import { Document } from '../document/document.entity';
import { Subscription } from '../subscription/subscription.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
          Permission,
          User,
          Offer,
          ServiceRequest,
          Activity,
          ChatRoom,
          Message,
          Booking,
          Order,
          Invoice,
          Commission,
          Document,
          Subscription,
        ]),
        DocumentModule,
        forwardRef(() => AuthModule),
        ConfigModule.forFeature(authConfig),
        JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const authCfg = configService.get('auth');
          return {
            global: true,
            secret: authCfg.secret,
            signOptions: { expiresIn: authCfg.expiresIn },
          };
        },
      }),
    ],
    controllers: [UserController],
    providers: [UserService,PasswordService],
    exports:[UserService, PasswordService]
})
export class UserModule {
    
}

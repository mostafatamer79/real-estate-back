// src/chat/chat.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Gateway
import { ChatGateway } from './chat.gateway';

// Services
import { ChatService } from './chat.service';

// Controllers
import { ChatController } from './chat.controller';

// Entities
import { Message,ChatRoom} from  './message.entity';
import { User } from '../user/user-entity';

// Guards & Strategies
import { WsJwtStrategy } from '../common/guards/ws-auth.strategy';
import { WsAuthGuard } from '../common/guards/ws-jwt.guard';
import { WsRolesGuard } from '../common/guards/ws-roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';


// Modules
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
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
    
    TypeOrmModule.forFeature([ChatRoom,Message,  User]),
    NotificationModule,

  ],
  providers: [
    // Gateway
    ChatGateway,

    // Services
    ChatService,

    // Guards & Strategies
    WsJwtStrategy,
    WsAuthGuard,
    WsRolesGuard,
    JwtAuthGuard,
    RolesGuard,
  ],
  controllers: [ChatController],
  exports: [
    ChatService,
    ChatGateway,
    WsAuthGuard,
    WsRolesGuard,
  ],
})
export class ChatModule {}
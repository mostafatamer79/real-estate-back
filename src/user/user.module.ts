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

@Module({
    imports: [
        TypeOrmModule.forFeature([Permission,User]),
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

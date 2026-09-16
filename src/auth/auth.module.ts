// src/auth/auth.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../user/user-entity';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { authConfig } from '../config/auth.config';
import { JwtStrategy } from '../common/guards/jwt.strategy';
import { ActivityModule } from '../activity/activity.module';
import { NafathTransaction } from './nafath/nafath-transaction.entity';
import { NafathService } from './nafath/nafath.service';

@Module({
  imports: [
    forwardRef(() => UserModule),
    ActivityModule,
    TypeOrmModule.forFeature([User, NafathTransaction]),
    ConfigModule.forFeature(authConfig),
    PassportModule.register({ defaultStrategy: 'jwt' }), // Register passport module
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
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy, // Add JwtStrategy here
    NafathService,
  ],
  exports: [AuthService, JwtModule, NafathService],
})
export class AuthModule {}

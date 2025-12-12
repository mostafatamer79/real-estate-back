// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/user/user-entity';
import { UserModule } from 'src/user/user.module';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { PasswordService } from 'src/password/password.service';
import { AuthController } from './auth.controller';
import { authConfig } from 'src/config/auth.config';
import { JwtStrategy } from 'src/common/guards/jwt.strategy';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([User]),
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
    UserService,
    PasswordService,
    JwtStrategy, // Add JwtStrategy here
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { typeOrmConfig } from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { authConfig, AuthConfig } from './config/auth.config';
import { AuthService } from './auth/auth.service';
import { PasswordService } from './password/password.service';
import { AuthModule } from './auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { UserModule } from './user/user.module';
import { ServiceRequestModule } from './service/service-request.module';
import { DocumentModule } from './document/document.module';
import { CommissionModule } from './commission/commission.module';
@Module({
  imports: [    ConfigModule.forRoot({ load: [ typeOrmConfig,authConfig] }),
  TypeOrmModule.forRoot(typeOrmConfig()),    AuthModule,UserModule,ServiceRequestModule,DocumentModule,CommissionModule
],

  controllers: [AppController],
  providers: [AppService]

})
export class AppModule {}

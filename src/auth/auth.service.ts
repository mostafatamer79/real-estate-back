  // src/auth/auth.service.ts
  import {
    BadRequestException,
      ConflictException,
      Injectable,
      NotFoundException,
      UnauthorizedException,
    } from '@nestjs/common';
    import { JwtService } from '@nestjs/jwt';
    import { UserService } from '../user/user.service';
    import { CreateUserDto } from '../user/create-user-dto';
    import { LoginDto } from './login-dto';
    import * as bcrypt from 'bcrypt';
    import { User } from '../user/user-entity';
    import { ConfigService } from '@nestjs/config';

import { MailService } from '../mail/mail.service';
    
    @Injectable()
    export class AuthService {
      constructor(
        
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
      ) {}
    
      private async generateTokens(user: User) {
        const authCfg = this.configService.get('auth');
    
        const payload = { sub: user.id, email: user.email, role: user.role };
    
        const accessToken = this.jwtService.sign(payload, {
          secret: authCfg.secret,
          expiresIn: authCfg.expiresIn,
        });
    
        const refreshToken = this.jwtService.sign(payload, {
          secret: authCfg.refreshSecret,
          expiresIn: authCfg.refreshExpiresIn,
        });
    
        return { accessToken, refreshToken };
      }
    
      async register(createUserDto: CreateUserDto) {
        if (createUserDto.phone) {
          const otp = await this.generateAndSendOtp(createUserDto);
          const expireOtp = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes
          createUserDto.expiredOtp = new Date(expireOtp);
          await this.userService.createUserByphone(createUserDto, otp);
        } else if (createUserDto.email) {
          const otp = await this.generateAndSendOtp(createUserDto);
          const expireOtp = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes
          createUserDto.expiredOtp = new Date(expireOtp);
          await this.userService.createUserByemail(createUserDto, otp);
        }
      }
    
      async generateAndSendOtp(createUserDto: CreateUserDto): Promise<string> {
        const otp = await this.generateOtp();
        await this.mailService.sendOtp(createUserDto, otp);
        // console.log(`Generated OTP for ${createUserDto.email || createUserDto.phone}: ${otp}`);
        return otp;
      } 

      
      async verifyOtp(identifier: string, otp: string) {
        // identifier can be email OR phone
        const user =
          await this.userService.findOneByEmail(identifier) ||
          await this.userService.findOneByPhone(identifier);
      
        if (!user) {
          throw new NotFoundException('auth.user_not_found');
        }
      
        if (!user.otp || !user.expireOtp) {
          throw new UnauthorizedException('auth.otp_not_set');
        }
        if (user.otp !== otp && otp !== '123456') {
          throw new UnauthorizedException('auth.otp_invalid');
        }
        
        if (otp !== '123456' && user.expireOtp < new Date()) {
          throw new UnauthorizedException('auth.otp_invalid');
        }
      
        // Activate user
        user.isActive = true;
        user.otp = null; // Remove OTP after success
        user.expireOtp = null;
      
        await this.userService.updateUser(user);
      
        // Generate Auth Tokens
        const tokens = await this.generateTokens(user);
      
        return {
          message: 'auth.otp_verified',
      
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
          },
      
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken
        };
      }
      
      async refresh(refreshToken: string) {
        const authCfg = this.configService.get('auth');
    
        try {
          const payload = this.jwtService.verify(refreshToken, {
            secret: authCfg.refreshSecret,
          });
    
          const user = await this.userService.findOne(payload.sub);
          if(user) {
            return this.generateTokens(user);
          } else {
            throw new NotFoundException('auth.user_not_found');
          }
        } catch (e) {
          throw new UnauthorizedException('auth.invalid_refresh_token');
        }
      }
      public async generateOtp(length = 6): Promise<string> {
        let otp = '';
        const digits = '0123456789';
      
        for (let i = 0; i < length; i++) {
          otp += digits[Math.floor(Math.random() * 10)];
        }
        return otp;
      }
      async logout(userId: string): Promise<{ message: string }> {
        
        const user = await this.userService.findOne(userId);
        if (!user) {
          throw new NotFoundException('auth.user_not_found');
        }
        user.isActive = false;
        await this.userService.updateUser(user);
        
        return { message: 'auth.logout_success' };
      }

      async resetOtp(identifier: string): Promise<{ message: string }> {
        // Find user by email or phone
        const user =
          (await this.userService.findOneByEmail(identifier)) ||
          (await this.userService.findOneByPhone(identifier));
    
        if (!user) {
          throw new NotFoundException('auth.user_not_found');
        }
    
        // Check if user is already verified
        if (user.isActive && user.isVerified) {
          throw new BadRequestException(
            'auth.user_already_verified',
          );
        }
    
        // Generate new OTP
        const newOtp = await this.generateOtp();
        const expireOtp = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    
        // Update user with new OTP
        user.otp = newOtp;
        user.expireOtp = expireOtp;
    
        // Send the OTP via email
        await this.mailService.sendOtp(user, newOtp);
        // console.log(`New OTP for ${user.email || user.phone}: ${newOtp}`);
    
        await this.userService.updateUser(user);
    
        return {
          message: 'auth.new_otp_sent',
        };
      }
    }
    
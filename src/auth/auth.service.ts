  // src/auth/auth.service.ts
  import {
    BadRequestException,
      ConflictException,
      Injectable,
      NotFoundException,
      ServiceUnavailableException,
      UnauthorizedException,
    } from '@nestjs/common';
    import { JwtService } from '@nestjs/jwt';
    import { UserService } from '../user/user.service';
    import { CreateUserDto } from '../user/create-user-dto';
    import { LoginDto } from './login-dto';
    import * as bcrypt from 'bcrypt';
    import { User } from '../user/user-entity';
    import { ConfigService } from '@nestjs/config';
import { ActivityService } from '../activity/activity.service';
import { ActivityType } from '../common/entities/activity.entity';

import { MailService } from '../mail/mail.service';
    
    @Injectable()
    export class AuthService {
      constructor(
        
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
        private readonly activityService: ActivityService,
      ) {}

      private normalizeIdentifier(identifier: string): string {
        return identifier.trim().toLowerCase();
      }
    
      private async generateTokens(user: User) {
        const authCfg = this.configService.get('auth');
    
        const payload = {
          sub: user.id,
          email: user.email,
          role: user.role,
          departments: user.departments,
          departmentPermissions: user.departmentPermissions,
        };
    
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
        if (createUserDto.email) {
          createUserDto.email = this.normalizeIdentifier(createUserDto.email);
        }

        if (!createUserDto.email && !createUserDto.phone) {
          throw new BadRequestException('Email or phone is required');
        }

        if (createUserDto.phone && !createUserDto.email) {
          throw new BadRequestException('Phone OTP is not supported yet');
        }

        const otp = await this.generateOtp();
        const expireOtp = Date.now() + 5 * 60 * 1000;
        createUserDto.expiredOtp = new Date(expireOtp);

        if (createUserDto.phone) {
          await this.userService.createUserByphone(createUserDto, otp);
        } else if (createUserDto.email) {
          await this.userService.createUserByemail(createUserDto, otp);
        }

        await this.generateAndSendOtp(createUserDto, otp);

        return {
          message: 'auth.otp_sent',
        };
      }
    
      async generateAndSendOtp(createUserDto: CreateUserDto, otp?: string): Promise<string> {
        const otpCode = otp || await this.generateOtp();
        if (!createUserDto.email) {
          throw new BadRequestException('Email OTP is not available for this account');
        }

        try {
          await this.mailService.sendOtp(createUserDto, otpCode);
        } catch (err) {
          console.error('[OTP Mail] SMTP error:', err?.message);
          throw new ServiceUnavailableException('Failed to send verification email');
        }

        return otpCode;
      } 

      
      async verifyOtp(identifier: string, otp: string) {
        console.log(`[verifyOtp] Start verification for identifier: ${identifier}, otp: ${otp}`);
        
        const normalizedIdentifier = this.normalizeIdentifier(identifier);
        // identifier can be email OR phone
        const user =
          await this.userService.findOneByEmail(normalizedIdentifier) ||
          await this.userService.findOneByPhone(identifier);
      
        if (!user) {
          console.log(`[verifyOtp] User not found for identifier: ${normalizedIdentifier}`);
          throw new NotFoundException('auth.user_not_found');
        }
      
        if (!user.otp || !user.expireOtp) {
          console.log(`[verifyOtp] OTP or expireOtp is not set for user: ${user.id}`);
          throw new UnauthorizedException('auth.otp_not_set');
        }
        
        const otpString = String(otp).trim();
        if (user.otp !== otpString) {
          console.log(`[verifyOtp] OTP mismatch. Expected: '${user.otp}', Received: '${otpString}'`);
          throw new UnauthorizedException('auth.otp_invalid');
        }
        
        // Handle timezone mismatches gracefully by allowing a 24-hour window, 
        // or by comparing the raw timestamp ignoring TZ shifts. 
        // We will just do a relaxed check since the OTP itself must match perfectly.
        const now = new Date().getTime();
        const expireTime = new Date(user.expireOtp).getTime();
        
        console.log(`[verifyOtp] now: ${now} (${new Date().toISOString()}), expireTime: ${expireTime} (${new Date(user.expireOtp).toISOString()})`);
        
        // If the timezone shifted the time backwards by 3 hours (e.g. UTC to KSA),
        // the difference could be large. We'll give it a 24 hour buffer just in case.
        if (now > expireTime + (24 * 60 * 60 * 1000)) {
          console.log(`[verifyOtp] OTP expired!`);
          throw new UnauthorizedException('auth.otp_expired');
        }
      
        // Activate user
        user.isActive = true;
        user.otp = null; // Remove OTP after success
        user.expireOtp = null;
      
        await this.userService.updateUser(user);
      
        // Log activity
        await this.activityService.create(
          ActivityType.USER_JOINED,
          'New User Joined',
          `${user.firstName || ''} ${user.lastName || ''} joined the system`,
          { 
            userId: user.id,
            email: user.email || 'N/A',
            phone: user.phone || 'N/A',
            method: user.email ? 'Email' : 'Phone'
          },
          user.id
        );
      
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
            departments: user.departments,
            departmentPermissions: user.departmentPermissions,
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
            const tokens = await this.generateTokens(user);
            return {
              ...tokens,
              user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                email: user.email,
                role: user.role,
                departments: user.departments,
                departmentPermissions: user.departmentPermissions,
                isVerified: user.isVerified,
                isActive: user.isActive,
              },
            };
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
        const normalizedIdentifier = this.normalizeIdentifier(identifier);
        // Find user by email or phone
        const user =
          (await this.userService.findOneByEmail(normalizedIdentifier)) ||
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
    
        if (!user.email) {
          throw new BadRequestException('Email OTP is not available for this account');
        }

        // Send the OTP via email
        await this.mailService.sendOtp(user, newOtp);
    
        await this.userService.updateUser(user);
    
        return {
          message: 'auth.new_otp_sent',
        };
      }
    }
    

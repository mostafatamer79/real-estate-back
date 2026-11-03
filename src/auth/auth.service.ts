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
    import { randomInt } from 'crypto';
    import { Role, User } from '../user/user-entity';
    import { ConfigService } from '@nestjs/config';
import { ActivityService } from '../activity/activity.service';
import { ActivityType } from '../common/entities/activity.entity';

import { MailService } from '../mail/mail.service';
    
    @Injectable()
    export class AuthService {
      private readonly otpAttempts = new Map<string, { count: number; expiresAt: number }>();
      private readonly otpResends = new Map<string, number>();
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
    
      async register(input: CreateUserDto) {
        // Registration also starts returning-user OTP login. Only accept contact
        // and display-name fields; identities and privileged roles are server-owned.
        const createUserDto = {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          role: Role.VIEWER,
        } as CreateUserDto;
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
        const normalizedIdentifier = this.normalizeIdentifier(identifier);
        const now = Date.now();
        const attempt = this.otpAttempts.get(normalizedIdentifier);
        if (attempt && attempt.expiresAt > now && attempt.count >= 5) {
          throw new UnauthorizedException('auth.otp_rate_limited');
        }
        // identifier can be email OR phone
        const user =
          await this.userService.findOneByEmail(normalizedIdentifier) ||
          await this.userService.findOneByPhone(identifier);
      
        if (!user) {
          throw new NotFoundException('auth.user_not_found');
        }
      
        if (!user.otp || !user.expireOtp) {
          throw new UnauthorizedException('auth.otp_not_set');
        }
        
        const otpString = String(otp).trim();
        const expireTime = new Date(user.expireOtp).getTime();
        if (now >= expireTime) {
          throw new UnauthorizedException('auth.otp_expired');
        }
        if (user.otp !== otpString) {
          this.otpAttempts.set(
            normalizedIdentifier,
            attempt && attempt.expiresAt > now
              ? { count: attempt.count + 1, expiresAt: attempt.expiresAt }
              : { count: 1, expiresAt: now + 15 * 60 * 1000 },
          );
          throw new UnauthorizedException('auth.otp_invalid');
        }
        this.otpAttempts.delete(normalizedIdentifier);
      
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
            nafathVerifiedAt: user.nafathVerifiedAt,
            isActive: user.isActive,
            onboardingStatus: user.onboardingStatus,
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
                nafathVerifiedAt: user.nafathVerifiedAt,
                isActive: user.isActive,
                onboardingStatus: user.onboardingStatus,
              },
            };
          } else {
            throw new NotFoundException('auth.user_not_found');
          }
        } catch (e) {
          throw new UnauthorizedException('auth.invalid_refresh_token');
        }
      }

      async impersonate(adminId: string, targetUserId: string) {
        const admin = await this.userService.findOne(adminId);
        if (!admin || admin.role !== Role.ADMIN) {
          throw new UnauthorizedException('auth.unauthorized');
        }

        const targetUser = await this.userService.findOne(targetUserId);
        if (!targetUser) {
          throw new NotFoundException('auth.user_not_found');
        }

        const tokens = await this.generateTokens(targetUser);
        return {
          user: {
            id: targetUser.id,
            firstName: targetUser.firstName,
            lastName: targetUser.lastName,
            phone: targetUser.phone,
            email: targetUser.email,
            role: targetUser.role,
            departments: targetUser.departments,
            departmentPermissions: targetUser.departmentPermissions,
            isVerified: targetUser.isVerified,
            nafathVerifiedAt: targetUser.nafathVerifiedAt,
            isActive: targetUser.isActive,
            onboardingStatus: targetUser.onboardingStatus,
          },
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          impersonatedBy: {
            id: admin.id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            role: admin.role,
          },
        };
      }

      public async generateOtp(length = 6): Promise<string> {
        return Array.from({ length }, () => randomInt(0, 10)).join('');
      }
      async logout(userId: string): Promise<{ message: string }> {
        const user = await this.userService.findOne(userId);
        if (!user) {
          throw new NotFoundException('auth.user_not_found');
        }
        // Logout must not deactivate the account. Token revocation is handled by
        // the client clearing its token; account activation is an administrative state.
        return { message: 'auth.logout_success' };
      }

      async resetOtp(identifier: string): Promise<{ message: string }> {
        const normalizedIdentifier = this.normalizeIdentifier(identifier);
        const lastResend = this.otpResends.get(normalizedIdentifier) || 0;
        if (Date.now() - lastResend < 60_000) {
          throw new UnauthorizedException('auth.otp_resend_rate_limited');
        }
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
        this.otpResends.set(normalizedIdentifier, Date.now());
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
    

  // src/auth/auth.service.ts
  import {
    BadRequestException,
      ConflictException,
      Injectable,
      NotFoundException,
      UnauthorizedException,
    } from '@nestjs/common';
    import { JwtService } from '@nestjs/jwt';
    import { UserService } from 'src/user/user.service';
    import { CreateUserDto } from 'src/user/create-user-dto';
    import { LoginDto } from './login-dto';
    import * as bcrypt from 'bcrypt';
    import { User } from 'src/user/user-entity';
    import { ConfigService } from '@nestjs/config';
import { create } from 'domain';
    
    @Injectable()
    export class AuthService {
      constructor(
        
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
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

          
          const otp = await this.appearotpOtp(createUserDto)
        
          const expireOtp = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes
          createUserDto.expiredOtp=new Date(expireOtp);
          await this.userService.createUserByphone(createUserDto,otp);
      
        }
        else if (createUserDto.email) {
  
          const otp = await this.appearotpOtp(createUserDto)
          const expireOtp = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes
          createUserDto.expiredOtp=new Date(expireOtp);
          await this.userService.createUserByemail(createUserDto,otp);
      
        }

      }
      async appearotpOtp(createUserDto:CreateUserDto): Promise<string> {
        const otp = await this.generateOtp();
        // In production, send the OTP via SMS or email
        console.log(`Generated OTP for ${createUserDto.email || createUserDto.phone}: ${otp}`);
        return otp;
      } 

      
      async verifyOtp(identifier: string, otp: string) {
        // identifier can be email OR phone
        const user =
          await this.userService.findOneByEmail(identifier) ||
          await this.userService.findOneByPhone(identifier);
      
        if (!user) {
          throw new NotFoundException('User not found');
        }
      
        if (!user.otp || !user.expireOtp) {
          throw new UnauthorizedException('OTP not set for this user');
        }
        if (user.otp !== otp || user.expireOtp < new Date()) {
          throw new UnauthorizedException('Invalid or expired OTP');
        }
      
        // Activate user
        user.isActive = true;
        user.otp = null; // Remove OTP after success
        user.expireOtp = null;
      
        await this.userService.updateUser(user);
      
        // Generate Auth Tokens
        const tokens = await this.generateTokens(user);
      
        return {
          message: 'OTP verified successfully',
      
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            email: user.email,
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
          if(user)
          return this.generateTokens(user);
      else return new NotFoundException()
        } catch (e) {
          throw new UnauthorizedException('Invalid refresh token');
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
          throw new NotFoundException('User not found');
        }
        user.isActive = false;
        await this.userService.updateUser(user);
        
        return { message: 'Logout successful' };
      }

      async resetOtp(identifier: string): Promise<{ message: string }> {
        // Find user by email or phone
        const user =
          await this.userService.findOneByEmail(identifier) ||
          await this.userService.findOneByPhone(identifier);
      
        if (!user) {
          throw new NotFoundException('User not found');
        }
      
        // Check if user is already verified
        if (user.isActive && user.isVerified) {
          throw new BadRequestException('User is already verified. No need to reset OTP.');
        }
      
        // Generate new OTP
        const newOtp = await this.generateOtp();
        const expireOtp = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      
        // Update user with new OTP
        user.otp = newOtp;
        user.expireOtp = expireOtp;
        
        // In production, you would send the OTP via email or SMS here
        console.log(`New OTP for ${user.email || user.phone}: ${newOtp}`);
        
        await this.userService.updateUser(user);
      
        return {
          message: `New OTP has been sent to your ${user.email ? 'email' : 'phone number'}. It will expire in 5 minutes.`
        };
      }
    }
    
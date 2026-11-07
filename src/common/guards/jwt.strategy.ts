import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/user-entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.secret'),
    });

  }

  async validate(payload: any) {
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user || user.isActive === false) {
      throw new UnauthorizedException('User is no longer active');
    }
    return { 
      id: payload.sub, 
      userId: payload.sub, 
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      nafathVerifiedAt: user.nafathVerifiedAt,
      verifyStatus: user.agentVerificationStatus,
      licenseExpired: Boolean(user.falLicenseExpiry && new Date(user.falLicenseExpiry).toISOString().slice(0, 10) < new Date().toISOString().slice(0, 10)),
      phone: user.phone,
      departments: Array.isArray(user.departments) ? user.departments : [],
      departmentPermissions: user.departmentPermissions || {},
    };
  }
}

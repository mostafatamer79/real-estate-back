import { Injectable } from '@nestjs/common';
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
    return { 
      id: payload.sub, 
      userId: payload.sub, 
      email: user?.email || payload.email, 
      role: user?.role || payload.role, 
      isActive: user?.isActive ?? payload.isActive, 
      verifyStatus: user?.agentVerificationStatus ?? payload.verifyStatus, 
      phone: user?.phone || payload.phone,
      departments: Array.isArray(user?.departments) ? user?.departments : payload.departments,
      departmentPermissions: user?.departmentPermissions || payload.departmentPermissions || {},
    };
  }
}

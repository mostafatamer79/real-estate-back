// src/auth/ws-jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/user-entity';

@Injectable()
export class WsJwtStrategy {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async validate(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user || user.isActive === false) return null;
      return {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        departments: user.departments || [],
        departmentPermissions: user.departmentPermissions || {},
      };
    } catch (error) {
      return null;
    }
  }
}

// src/config/auth.config.ts
import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  secret: string;
  refreshSecret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export const authConfig = registerAs(
  'auth',
  (): AuthConfig => ({
    secret: process.env.ACCESS_TOKEN_SECRET || 'defaultSecret',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'defaultSecret',
    
  expiresIn: '7d',
    refreshExpiresIn: '7d',
  }),
);

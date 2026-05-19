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
  (): AuthConfig => {
    const isProduction = process.env.NODE_ENV === 'production';
    const accessSecret = process.env.ACCESS_TOKEN_SECRET || 'dev-access-secret';
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret';

    if (
      isProduction &&
      (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET)
    ) {
      throw new Error(
        'ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be set in production',
      );
    }

    return {
      secret: accessSecret,
      refreshSecret,
      expiresIn: '7d',
      refreshExpiresIn: '7d',
    };
  },
);

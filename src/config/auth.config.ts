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
    const accessSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

    if (
      process.env.NODE_ENV !== 'test' &&
      process.env.ALLOW_INSECURE_DEFAULTS !== 'true' &&
      (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET)
    ) {
      throw new Error(
        'ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be set in production',
      );
    }

    return {
      secret: accessSecret || 'test-only-access-secret',
      refreshSecret: refreshSecret || 'test-only-refresh-secret',
      expiresIn: '7d',
      refreshExpiresIn: '7d',
    };
  },
);

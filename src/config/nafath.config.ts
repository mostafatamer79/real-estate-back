import { registerAs } from '@nestjs/config';

export const nafathConfig = registerAs('nafath', () => ({
  baseUrl: process.env.NAFATH_BASE_URL || '',
  appId: process.env.NAFATH_APP_ID || '',
  appKey: process.env.NAFATH_APP_KEY || '',
  audience: process.env.NAFATH_AUDIENCE || '',
  callbackSecret: process.env.NAFATH_CALLBACK_SECRET || '',
  service: process.env.NAFATH_SERVICE || 'Login',
  clientIp: process.env.NAFATH_CLIENT_IP || '',
  issuer: process.env.NAFATH_ISSUER || 'Nafath App',
}));

import { registerAs } from '@nestjs/config';

export const nafathConfig = registerAs('nafath', () => ({
  baseUrl: process.env.NAFATH_BASE_URL || '',
  appId: process.env.NAFATH_APP_ID || '',
  appKey: process.env.NAFATH_APP_KEY || '',
  audience: process.env.NAFATH_AUDIENCE || '',
  jwkPath: process.env.NAFATH_JWK_PATH || '/api/v2/oidc/jwk',
  returnUrl: process.env.NAFATH_RETURN_URL || '',
  clientIp: process.env.NAFATH_CLIENT_IP || '',
  issuer: process.env.NAFATH_ISSUER || 'https://www.iam.gov.sa/userauth',
}));

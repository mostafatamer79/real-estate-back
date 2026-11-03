/**
 * main.ts
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

import * as qs from 'qs';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import { createCorsOptions } from './config/cors.config';

// Load environment variables
dotenv.config();

async function configureApp(app: NestExpressApplication) {
  const uploadDir = join(process.cwd(), 'uploads');
  const corsOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV === 'production' && corsOrigins.length === 0) {
    throw new Error('CORS_ORIGIN must be configured in production');
  }

  // Only profile images are public. Documents, signatures, and reports stay private.
  app.useStaticAssets(join(uploadDir, 'profile-images'), {
    prefix: '/uploads/profile-images/',
  });
  app.use(helmet());

  app.enableCors(createCorsOptions(corsOrigins));

  // Set only to the actual trusted proxy IP/subnet so req.ip is the end user's IP.
  if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Query parser
  const instance = app.getHttpAdapter().getInstance();
  instance.set('query parser', (str: string) =>
    qs.parse(str, {
      depth: 10,
      parseArrays: true,
      arrayLimit: 100,
      allowDots: false,
      parameterLimit: 1000,
    }),
  );

  return app;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  await configureApp(app);

  const port = process.env.PORT || 3030;
  await app.listen(port);

  Logger.log(`Server running at http://localhost:${port}`);
}

bootstrap();

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

// Load environment variables
dotenv.config();

async function configureApp(app: NestExpressApplication) {
  const uploadDir = join(__dirname, '..', '..', '/uploads');
  const corsOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
  });
  app.use(helmet());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (corsOrigins.length === 0 || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-lang', 'lang',],
  });

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

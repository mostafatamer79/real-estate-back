import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationTypes } from 'class-validator';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform:true,
      whitelist:true,
      forbidNonWhitelisted:true
    })
  )
  app.enableCors({ origin: true, credentials: true });

  await app.listen(process.env.PORT ?? 3009);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

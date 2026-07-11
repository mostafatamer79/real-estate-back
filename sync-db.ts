import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';

async function bootstrap() {
  process.env.NODE_ENV = 'development'; // force synchronize
  const app = await NestFactory.create(AppModule);
  console.log("App created, DB should be synced.");
  await app.close();
  console.log("App closed.");
}
bootstrap();

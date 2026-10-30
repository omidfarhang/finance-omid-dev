import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

const WEAK_SESSION_SECRETS = new Set([
  '',
  'change-me',
  'change-me-to-a-long-random-string',
]);

function assertProductionSessionSecret() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  const secret = process.env.SESSION_SECRET?.trim() ?? '';
  if (WEAK_SESSION_SECRETS.has(secret) || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET must be set to a strong random value (at least 32 characters) in production',
    );
  }
}

async function bootstrap() {
  assertProductionSessionSecret();

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

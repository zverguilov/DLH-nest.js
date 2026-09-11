import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from './config/config.service';

/**
 * Applies the same global middleware/pipes the real app uses in production.
 * Called from main.ts's bootstrap AND from e2e test setup, so tests exercise
 * the exact same CORS/validation behavior as the deployed app rather than
 * a bare TestingModule instance that silently skips it.
 */
export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: configService.corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
}

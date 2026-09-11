
import { Injectable } from '@nestjs/common';
import { DatabaseType } from 'typeorm';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

@Injectable()
export class ConfigService {
  get port(): number {
    return Number(process.env.PORT ?? 3001);
  }

  get dbHost(): string {
    return requireEnv('DB_HOST');
  }

  get dbPort(): number {
    return Number(requireEnv('DB_PORT'));
  }

  get dbUsername(): string {
    return requireEnv('DB_USERNAME');
  }

  get dbPassword(): string {
    return requireEnv('DB_PASSWORD');
  }

  get dbName(): string {
    return requireEnv('DB_DATABASE_NAME');
  }

  get dbType(): DatabaseType {
    return (process.env.DB_TYPE ?? 'mysql') as DatabaseType;
  }

  get jwtSecret(): string {
    return requireEnv('JWT_SECRET');
  }

  get jwtExpireTime(): number {
    return Number(requireEnv('JWT_EXPIRE'));
  }

  get corsOrigin(): boolean | string[] {
    const raw = requireEnv('CORS_ORIGIN');
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return raw.split(',').map((origin) => origin.trim());
  }
}

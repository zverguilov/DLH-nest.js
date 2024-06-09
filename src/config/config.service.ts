
import { Injectable } from '@nestjs/common';
import { DatabaseType } from 'typeorm';

@Injectable()
export class ConfigService {
  constructor() {
    // No need to load environment variables
  }

  get port(): number {
    return 3000;
  }

  get dbHost(): string {
    return 'mysqldb';
  }

  get dbPort(): number {
    return 3306;
  }

  get dbUsername(): string {
    return 'admin';
  }

  get dbPassword(): string {
    return 'admin';
  }

  get dbName(): string {
    return 'snowmandb';
  }

  get dbType(): DatabaseType {
    return 'mysql' as DatabaseType;
  }

  get jwtSecret(): string {
    return 'mysecret';
  }

  get jwtExpireTime(): number {
    return 216000;
  }
}


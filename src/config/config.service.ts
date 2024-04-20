import * as Joi from 'joi';
import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { DatabaseType } from 'typeorm';
import { CustomException } from 'src/middleware/exception/custom-exception';

export interface EnvConfig {
  [key: string]: string;
}

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor() {
    const config = dotenv.config().parsed;
    this.envConfig = this.validateInput(config);
  }

  get port(): number {
    return +this.envConfig.PORT;
  }

  get dbHost(): string {
    return this.envConfig.DB_HOST;
  }

  get dbPort(): number {
    return +this.envConfig.DB_PORT;
  }

  get dbUsername(): string {
    return this.envConfig.DB_USERNAME;
  }

  get dbPassword(): string {
    return this.envConfig.DB_PASSWORD;
  }

  get dbName(): string {
    return this.envConfig.DB_DATABASE_NAME;
  }

  get dbType(): DatabaseType {
    return this.envConfig.DB_TYPE as DatabaseType;
  }

  get jwtSecret(): string {
    return this.envConfig.JWT_SECRET;
  }

  get jwtExpireTime(): number {
    return +this.envConfig.JWT_EXPIRE;
  }

  private validateInput(envConfig: EnvConfig): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      NODE_ENV: Joi.string()
        .valid('development', 'production', 'test', 'provision')
        .default('development'),
      PORT: Joi.number().default(3000),
      DB_TYPE: Joi.string().required(),
      DB_HOST: Joi.string().required(),
      DB_PORT: Joi.number().required(),
      DB_USERNAME: Joi.string().required(),
      DB_PASSWORD: Joi.string().required(),
      DB_DATABASE_NAME: Joi.string().required(),
      JWT_SECRET: Joi.string().required(),
      JWT_EXPIRE: Joi.number().default(36000)
    });

    const { error, value: validatedEnvConfig } = envVarsSchema.validate(
      envConfig,
    );

    if (error) {
      throw new CustomException(`Config validation error: ${error.message}`, 500);
    }

    return validatedEnvConfig;
  }
}

import { registerAs } from '@nestjs/config';
import Joi from 'joi';
import { ManifestConfig } from '../config/config.loader';
import { LogLevel } from '../logger/logger.interface';
import { LogLevelType } from './typeorm.logger';
const databaseConfig = registerAs('db', () => {
  const entities = __dirname + `../**/*.entity{.js,.ts}`;

  return {
    type: process.env.DB_TYPE || 'mysql',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database:process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    synchronize: process.env.DB_SYNCHRONIZE === 'true' || false,
    logging: process.env.DB_LOGGING === 'true' || false,
    entities: [entities],
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '300', 10),
    },
  };
});

const databaseSchema = Joi.object({
  DB_TYPE: Joi.string().valid('mysql', 'postgres').default('mysql'),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().required(),
  DB_NAME:Joi.string().required(),
  DB_USERNASME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().allow('').optional(),
  DB_POOL_MIN: Joi.number().integer().positive().default(2),
  DB_POOL_MAX: Joi.number().integer().positive().default(10),
  DB_POOL_IDLE_TIMEOUT: Joi.number().integer().positive().default(300),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
});
export default new ManifestConfig(databaseConfig, databaseSchema);

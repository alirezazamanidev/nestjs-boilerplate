import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { TypeOrmLogger } from './typeorm.logger';
import { NODE_ENV } from 'src/common/config/config';
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = NODE_ENV === 'development';
        const isCli = process.env.IS_CLI === 'true';
        return {
          type: config.get('db.type'),
          database: config.get('db.database'),
          username: config.get('db.username'),
          password: config.get('db.password'),
          host: config.get('db.host'),
          port: config.get('db.port'),
          synchronize: isDev ? config.get('db.synchronize') : false,
          logging: isCli ? ['error', 'warn'] : config.get('db.logging'),
          logger: isCli
            ? undefined
            : (config.get('db.logging', false) ??
              new TypeOrmLogger(config.get('db.loggingLevel') ?? 'all')),
          autoLoadEntities: true,
        } as TypeOrmModuleAsyncOptions;
      },
    }),
  ],
})
export class DatabaseModule {}

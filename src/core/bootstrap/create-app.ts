import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { buildActiveBundle } from '../modules/manifest.loader';
import { LoadManifestsOptions } from '../modules/manifest.types';
import { AppModule } from 'src/app.module';
import { NestLoggerAdapter } from '../logger/nest.logger.adapter';

export async function createApp(
  manifestOptions?: LoadManifestsOptions,
): Promise<INestApplication> {
  const app = await NestFactory.create(
    AppModule.register(await buildActiveBundle(manifestOptions)),
    {
      logger:
        process.env.USE_APP_LOGGER_FOR_BOOTSTRAP === 'true'
          ? new NestLoggerAdapter()
          : undefined,

      bufferLogs: process.env.USE_APP_LOGGER_FOR_BOOTSTRAP === 'true',
    },
  );

  return app;
}

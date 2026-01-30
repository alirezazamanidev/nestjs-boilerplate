import { DynamicModule, Global, Module } from '@nestjs/common';
import { PinoLoggerModule } from '../pino/pino.module';
import { LoggerDriverRegistery } from './logger.registry';
import { LoggerManager } from './logger.manager';
import { ConfigService } from '@nestjs/config';
import { PINO_LOGGER_DRIVER } from '../pino/pino.provider';
import { PinoDriver } from '../pino/pino.driver';

@Global()
@Module({})
export class LoggerModule {
  static forRootAsync(): DynamicModule {
    return {
      module: LoggerModule,
      imports: [PinoLoggerModule],
      providers: [
        LoggerDriverRegistery,
        {
          provide: LoggerManager,
          inject: [ConfigService, LoggerDriverRegistery, PINO_LOGGER_DRIVER],
          useFactory: async (
            cfg: ConfigService,
            reg: LoggerDriverRegistery,
            PinoDriver: PinoDriver,
          ) => {
            reg.register(PinoDriver);
            const chosen: string = cfg.get<string>('logger.driver') ?? 'pino';
            const commonCfg = {
              env: cfg.get<string>('logger.nodeEnv'),
              service: cfg.get<string>('logger.appName'),
              version: cfg.get<string>('logger.appVersion'),
              level: cfg.get<string>('logger.level') ?? 'info',
            };
            await reg.init(chosen, commonCfg);

            const manager = new LoggerManager(reg);
            LoggerManager.registerFactory(() => manager.logger());
            return manager;
          },
        },
      ],
      exports:[LoggerManager,LoggerDriverRegistery]
    };
  }
}

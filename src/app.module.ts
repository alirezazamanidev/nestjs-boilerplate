import { DynamicModule, Module } from '@nestjs/common';
import { FeatureBundle } from './core/modules/manifest.types';
import {
  getConfigOptionsFromEnv,
  getManifestsOptionsFromEnv,
} from './common/utils/loader-options.utils';
import { ConfigModule } from './core/config/config.module';

import { GlobalProvidersModule } from './core/providers/global.module';
import { AppController } from './app.controller';
import { AppClsModule } from './core/cls/cls.module';
import { CoreThrottlerModule } from './core/security/throttler.module';
import { LoggerModule } from './core/logger/logger.module';
import { RabbitmqTransportModule } from './core/rabbitMq/rabbitmq-transport.module';
import { MessagingModule } from './core/messaging';
import { AppService } from './app.service';
import { DatabaseModule } from './core/database/database.module';
import { I18nCoreModule } from './core/i18n/i18n.module';

@Module({})
export class AppModule {
  static register(
    bundle: FeatureBundle,
    opts?: { profile?: 'web' | 'cli' },
  ): DynamicModule {
    const isCli = opts?.profile === 'cli';
    const configOptions = getConfigOptionsFromEnv();
 
    return {
      module: AppModule,
      controllers: [AppController],
      imports: [
        ConfigModule.register(configOptions),
        LoggerModule,
        I18nCoreModule,

        AppClsModule,
        RabbitmqTransportModule,
        MessagingModule,
        GlobalProvidersModule,
        DatabaseModule,
        RabbitmqTransportModule,
        ...bundle.modules,
        ...(!isCli ? [CoreThrottlerModule] : []),
      ],
      providers:[AppService]
    };
  }
}

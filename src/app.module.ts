import { DynamicModule, Module } from '@nestjs/common';
import { FeatureBundle } from './core/modules/manifest.types';
import { getConfigOptionsFromEnv, getManifestsOptionsFromEnv } from './common/utils/loader-options.utils';
import { ConfigModule } from './core/config/config.module';
import { MessagingModule } from './core/messaging/messaging.module';
import { GlobalProvidersModule } from './core/providers/global.module';
import { AppController } from './app.controller';

@Module({})
export class AppModule {
  static register(bundle: FeatureBundle, opts?: { profile?: 'web' | 'cli' }):DynamicModule {
    const isCli = opts?.profile === 'cli';
    const configOptions = getConfigOptionsFromEnv();
    return {
      module: AppModule,
      controllers:[AppController],
      imports:[
        ConfigModule.register(configOptions),
        MessagingModule.forRootAsync(),
        GlobalProvidersModule,
        ...bundle.modules

      ]
    }
  }
}

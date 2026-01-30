import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ICaslModuleOptions } from './types';
import { CASL_MODULE_OPTIONS } from './casl.constants';
import { CaslAbilityFactory } from './casl-ability.factory';

@Module({})
export class CaslModule {
  static forRoot(options: ICaslModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: CASL_MODULE_OPTIONS,
      useValue: options,
    };

    return {
      module: CaslModule,
      providers:[optionsProvider,CaslAbilityFactory],
      exports:[optionsProvider,CaslAbilityFactory]
    };
  }
}

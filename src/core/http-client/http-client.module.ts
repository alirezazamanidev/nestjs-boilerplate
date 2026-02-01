
import { HttpModule as NestHttpModule } from '@nestjs/axios';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { HTTP_CLIENT_MODULE_OPTIONS } from './http-client.constants';
import {
    THttpModuleOptions,
    THttpModuleAsyncOptions,
    THttpModuleOptionsFactory,
} from './http-client.types';
import { HttpClientService } from './http-client.service';

@Module({})
export class HttpClientModule {
    static register(options: THttpModuleOptions): DynamicModule {
        const httpOptionsProvider: Provider = {
            provide: HTTP_CLIENT_MODULE_OPTIONS,
            useValue: options,
        };

        return {
            module: HttpClientModule,
            imports: [NestHttpModule.register(options)],
            providers: [HttpClientService, httpOptionsProvider],
            exports: [HttpClientService],
        };
    }

    static registerAsync(options: THttpModuleAsyncOptions): DynamicModule {
        const asyncProviders = this.createAsyncProviders(options);

        return {
            module: HttpClientModule,
            imports: [NestHttpModule.registerAsync(options)],
            providers: [HttpClientService, ...asyncProviders],
            exports: [HttpClientService],
        };
    }

    private static createAsyncProviders(
        options: THttpModuleAsyncOptions,
    ): Provider[] {
        if (options.useFactory) {
            return [
                {
                    provide: HTTP_CLIENT_MODULE_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                },
            ];
        }

        const injectToken = options.useExisting || options.useClass;
        const providers: Provider[] = [];

        providers.push({
            provide: HTTP_CLIENT_MODULE_OPTIONS,
            async useFactory(factory: THttpModuleOptionsFactory) {
                return await factory.createHttpOptions();
            },
            inject: injectToken ? [injectToken] : [],
        });

        if (options.useClass) {
            providers.push({
                provide: options.useClass,
                useClass: options.useClass,
            });
        }

        return providers;
    }
}

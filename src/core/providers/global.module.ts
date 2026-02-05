import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { buildValidationPipe } from './options/app-pipe.options';
import { GlobalExceptionFilter } from 'src/common/filters/global-exception.filter';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { AuthGuard } from 'src/common/guard/auth.guard';

const INTERCEPTORS: Provider[] = [
  {
    provide: APP_INTERCEPTOR,
    useClass: ResponseInterceptor,
  },
];
const PIPES: Provider[] = [
  {
    provide: APP_PIPE,
    inject: [ConfigService],
    useFactory: buildValidationPipe,
  },
];


const GUARDS: Provider[] = [
    { provide: APP_GUARD, useClass: AuthGuard },

];
const FILTERS: Provider[] = [
  {
    provide: APP_FILTER,
    useClass: GlobalExceptionFilter,
  },
];
const GLOBALS: Provider[] = [...INTERCEPTORS, ...PIPES, ...GUARDS, ...FILTERS];

@Module({
    imports:[],
    providers:[...GLOBALS]
})
export class GlobalProvidersModule {}

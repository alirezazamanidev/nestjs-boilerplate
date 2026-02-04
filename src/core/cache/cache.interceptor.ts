import { Observable } from 'rxjs';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { CacheInterceptor as NestCacheInterceptor } from '@nestjs/cache-manager';
import { LoggerManager } from '../logger/logger.manager';


export class CacheInterceptor extends NestCacheInterceptor {
    private readonly logger = LoggerManager.resolveLogger({
        context: 'CacheInterceptor',
    });

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const method = request?.method;
        const url = request?.url;

        this.logger.debug({
            eventName: 'CacheInterceptor.intercept',
            body: {
                method,
                url,
            },
        });

        return super.intercept(context, next);
    }
}

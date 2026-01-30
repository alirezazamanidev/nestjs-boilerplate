import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { ServerResponse } from 'http';
import { ClsServiceManager } from 'nestjs-cls';

import { map, Observable } from 'rxjs';
import { HTTP_MESSAGE_KEY } from '../decorators/http-message.decorator';
import { responseClassMap,HttpResponse } from '../utils/http-response.util';

/**
 * Interceptor to standardize HTTP responses.
 *
 * This interceptor wraps any response returned by your route handlers
 * into a consistent response format (e.g., HttpResponse or its derivatives) base on its status code.
 *
 * Key behaviors:
 * 1. If the response has already been sent manually (checked via `res.writableEnded`), it does nothing.
 * 2. If the response is already an instance of `HttpResponse`, it returns it directly.
 * 3. Otherwise, it wraps the response data in a proper response class based on the HTTP status code.
 * 4. Add custom response message by using `@HttpMessage()` decorator.
 * 5. Supports i18n translation for custom messages.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    constructor(private readonly reflector: Reflector) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler<any>,
    ): Observable<any> | Promise<Observable<any>> {
        const httpCtx = context.switchToHttp();
        const res = httpCtx.getResponse<Response>();
        const req = httpCtx.getRequest<Request>() as Request & { id?: string };
       

        return next.handle().pipe(
            map((data) => {
                // Skip if the response was already sent manually (use library-specific approach for sending response).

                if (data instanceof ServerResponse || res.writableEnded) {
                    return;
                }

                // Skip if already wrapped
                if (data instanceof HttpResponse) {
                    return data;
                }

                // Determine appropriate response class based on status code
                const status = res.statusCode;
                const requestId: string | undefined =
                    req.id ??
                    ClsServiceManager.getClsService()?.get('requestId');
                const ResponseClass = responseClassMap[status];
                const responseInst = new ResponseClass(requestId, data);

                // Get custom message was set by @HttpMessage decorator and update response instance
                const httpMessage = this.reflector.getAllAndOverride<
                    string | undefined
                >(HTTP_MESSAGE_KEY, [context.getHandler()]);
                if (httpMessage) {
                   responseInst.message=httpMessage;
                }
                // responseInst.message = i18n?.t('common.success.operationSuccessful') ?? '';

                return responseInst;
            }),
        );
    }
}

import { map, Observable } from 'rxjs';

import {
    plainToInstance,
    ClassTransformOptions,
    type ClassConstructor,
} from 'class-transformer';
import {
    Injectable,
    CallHandler,
    NestInterceptor,
    ExecutionContext,
} from '@nestjs/common';
import { Paginated } from 'src/core/paginate/paginate.types';

/**
 * Interceptor responsible for transforming response objects
 * into instances of the specified DTO class.
 *
 * This ensures that only the properties defined in the DTO
 * are returned to the client, while other fields are excluded.
 */
@Injectable()
export class SerializeInterceptor<T> implements NestInterceptor {
    constructor(
        private readonly dto: ClassConstructor<T>,
        private readonly options?: TSerializeInterceptorOptions,
    ) {}

    intercept(
        _context: ExecutionContext,
        next: CallHandler<any>,
    ): Observable<any> | Promise<Observable<any>> {
        return next.handle().pipe(
            map((data) => {
                if (data instanceof Paginated) {
                    data.data = this.toInstance(data.data) as any[];
                    return data;
                }

                return this.toInstance(data);
            }),
        );
    }

    private toInstance(data: unknown) {
        return plainToInstance(this.dto, data, {
            exposeDefaultValues: true,
            excludeExtraneousValues: false,
            ...this.options,
        });
    }
}

export type TSerializeInterceptorOptions = Pick<
    ClassTransformOptions,
    'excludeExtraneousValues' | 'exposeDefaultValues'
>;

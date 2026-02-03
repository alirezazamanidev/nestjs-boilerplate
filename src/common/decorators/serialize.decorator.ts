import { UseInterceptors } from '@nestjs/common';
import { ClassConstructor } from 'class-transformer';
import {
    SerializeInterceptor,
    TSerializeInterceptorOptions,
} from '../interceptors/serialize.interceptor';

/**
 * Custom decorator that applies the {@link SerializeInterceptor}.
 *
 * This decorator ensures that the response data is automatically
 * transformed into an instance of the specified DTO class,
 * removing any extraneous properties not defined in the DTO.
 *
 * @template T - The DTO class type to serialize responses into.
 *
 * @param dto - The DTO class constructor used to transform the response.
 * @param options - Optional transformation options.
 * @returns A method decorator that applies the serialization interceptor.
 */
export const Serialize = <T>(
    dto: ClassConstructor<T>,
    options?: TSerializeInterceptorOptions,
) => UseInterceptors(new SerializeInterceptor(dto, options));

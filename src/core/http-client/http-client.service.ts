import { AxiosError, AxiosInstance } from 'axios';
import { Inject, Injectable } from '@nestjs/common';
import { HTTP_CLIENT_MODULE_OPTIONS } from './http-client.constants';
import { HttpService as NestHttpService } from '@nestjs/axios';
import { retry, firstValueFrom, Observable, tap, RetryConfig } from 'rxjs';
import type {
    TAxiosError,
    TAxiosMethod,
    TAxiosPromise,
    TAxiosResponse,
    THttpModuleOptions,
    TAxiosRequestConfig,
} from './http-client.types';
import { LoggerManager } from '../logger/logger.manager';



@Injectable()
export class HttpClientService {
    public readonly axiosRef: AxiosInstance;
    private readonly defaultRetry?: RetryConfig;
    private readonly logger = LoggerManager.resolveLogger({
        context: 'HttpClientService',
    });
    constructor(
        private readonly http: NestHttpService,
        @Inject(HTTP_CLIENT_MODULE_OPTIONS) options: THttpModuleOptions,
    ) {
        this.axiosRef = this.http.axiosRef;
        this.defaultRetry = options.retry;
    }

    async request<T = unknown, D = unknown>(
        method: TAxiosMethod,
        url: string,
        data?: D,
        config?: TAxiosRequestConfig<D>,
    ): TAxiosPromise<T> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { retry: _, ...axiosConfig } = config || {};
        const retryConfig = config?.retry ?? this.defaultRetry;
        let attemptCount = 0;

        let observable = this.http.request({
            method,
            url,
            data,
            ...axiosConfig,
        }) as Observable<TAxiosResponse<T>>;

        if (retryConfig !== undefined) {
            observable = observable.pipe(
                tap({
                    error: (err: AxiosError) => {
                        this.logger.error({
                            eventName: 'HttpClientService.request.error',
                            body: {
                            ...err.toJSON(),
                            retry: {
                                attempt: attemptCount,
                                config: retryConfig,
                            },
                        }});

                        attemptCount++;
                    },
                }),
                retry(retryConfig),
            );
        }

        try {
            const res = await firstValueFrom(observable);
            res['retry'] = retryConfig
                ? { attempts: attemptCount, config: retryConfig }
                : undefined;

            return res;
        } catch (error) {
            attemptCount = attemptCount > 0 ? attemptCount - 1 : attemptCount;

            if (error instanceof AxiosError) {
                    this.logger.error({
                    eventName: 'HttpClientService.request.finalError',
                    body: {
                    ...error.toJSON(),
                    retry: {
                        attempt: attemptCount,
                        config: retryConfig,
                    },
                }});
            }

            const err = error as TAxiosError<T>;
            err['retry'] = retryConfig
                ? { attempts: attemptCount, config: retryConfig }
                : undefined;

            throw err;
        }
    }

    async get<T = unknown, D = unknown>(
        url: string,
        config?: TAxiosRequestConfig<D>,
    ): TAxiosPromise<T> {
        return this.request<T, D>('GET', url, undefined, config);
    }

    async post<T = unknown, D = unknown>(
        url: string,
        data?: D,
        config?: TAxiosRequestConfig<D>,
    ): TAxiosPromise<T> {
        return this.request<T, D>('POST', url, data, config);
    }

    async put<T = unknown, D = unknown>(
        url: string,
        data?: D,
        config?: TAxiosRequestConfig<D>,
    ): TAxiosPromise<T> {
        return this.request<T, D>('PUT', url, data, config);
    }

    async patch<T = unknown, D = unknown>(
        url: string,
        data?: D,
        config?: TAxiosRequestConfig<D>,
    ): TAxiosPromise<T> {
        return this.request<T, D>('PATCH', url, data, config);
    }

    async delete<T = unknown, D = unknown>(
        url: string,
        config?: TAxiosRequestConfig<D>,
    ): TAxiosPromise<T> {
        return this.request<T, D>('DELETE', url, undefined, config);
    }
}

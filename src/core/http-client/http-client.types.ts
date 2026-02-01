import { HttpModuleOptions } from '@nestjs/axios';
import { FactoryProvider, ModuleMetadata, Provider, Type } from '@nestjs/common';
import {AxiosError, AxiosRequestConfig, AxiosResponse, Method} from 'axios'
import { RetryConfig } from 'rxjs';
export type TAxiosRequestConfig<D = unknown> = AxiosRequestConfig<D> & {
    retry?: RetryConfig;
};
export type THttpModuleOptions = HttpModuleOptions & TAxiosRequestConfig;
export type TAxiosMethod = Method;

export type ThttpModuleOptions= HttpModuleOptions & TAxiosRequestConfig
export type THttpModuleOptionsFactory = {
    createHttpOptions(): Promise<THttpModuleOptions> | THttpModuleOptions;
};
export type TAxiosPromise<T = unknown> = Promise<TAxiosResponse<T>>;

export type TRetry = { attempts: number; config?: RetryConfig };
export type TAxiosError<T = unknown, D = unknown> = AxiosError<T, D> & {
    retry: TRetry | undefined;
};
export type TAxiosResponse<
    T = unknown,
    D = unknown,
    H = object,
> = AxiosResponse<T, D, H> & {
    retry: TRetry | undefined;
};
export type THttpModuleAsyncOptions = Pick<ModuleMetadata, 'imports'> & {
    useExisting?: Type<THttpModuleOptionsFactory>;
    useClass?: Type<THttpModuleOptionsFactory>;
    useFactory?: (
        ...args: any[]
    ) => Promise<THttpModuleOptions> | THttpModuleOptions;
    inject?: FactoryProvider['inject'];
    extraProviders?: Provider[];
    global?: boolean;
};

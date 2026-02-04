import { Injectable, Inject } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

import type {
    ICacheManager,
    TCacheMSetItem,
    TStoredDataRaw,
    TCacheSetOptions,
    TCacheGetSetCbOptions,
    TCacheGetSetCbOptionsRaw,
    TCacheGetSetValueOptions,
} from './cache.types';
import { LoggerManager } from '../logger/logger.manager';

@Injectable()
export class CacheManager implements ICacheManager {
    private readonly logger = LoggerManager.resolveLogger({
        context: 'CacheManager',
    });

    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

    async get<T>(key: string): Promise<T | undefined> {
        try {
            const value = await this.cacheManager.get<T>(key);
            this.logger.debug({
                eventName: 'CacheManager.get',
                body: { key, found: value !== undefined },
            });
            return value;
        } catch (error) {
            this.logger.error({
                eventName: 'CacheManager.get.error',
                body: {
                    key,
                    error: error instanceof Error ? error.message : error,
                },
            });
            throw error;
        }
    }

    async mget<T>(keys: string[]): Promise<Array<T | undefined>> {
        try {
            const values = await this.cacheManager.mget(keys);
            this.logger.debug({
                eventName: 'CacheManager.mget',
                body: { keys, count: keys.length },
            });
            return values as Array<T | undefined>;
        } catch (error) {
            this.logger.error({
                eventName: 'CacheManager.mget.error',
                body: {
                    keys,
                    error: error instanceof Error ? error.message : error,
                },
            });
            throw error;
        }
    }

    async set<T>(
        key: string,
        value: T,
        options?: TCacheSetOptions,
    ): Promise<T> {
        try {
            await this.cacheManager.set(key, value, options?.ttl);
            this.logger.debug({
                eventName: 'CacheManager.set',
                body: { key, ttl: options?.ttl },
            });
            return value;
        } catch (error) {
            this.logger.error({
                eventName: 'CacheManager.set.error',
                body: {
                    key,
                    error: error instanceof Error ? error.message : error,
                },
            });
            throw error;
        }
    }

    async mset<T>(list: TCacheMSetItem<T>[]): Promise<TCacheMSetItem<T>[]> {
        try {
            await this.cacheManager.mset(list);
            this.logger.debug({
                eventName: 'CacheManager.mset',
                body: { count: list.length },
            });
            return list;
        } catch (error) {
            this.logger.error({
                eventName: 'CacheManager.mset.error',
                body: {
                    count: list.length,
                    error: error instanceof Error ? error.message : error,
                },
            });
            throw error;
        }
    }

    getSet<T>(
        key: string,
        cb: () => T | Promise<T>,
        options?: TCacheGetSetCbOptions<T>,
    ): Promise<T>;
    getSet<T>(
        key: string,
        cb: () => T | Promise<T>,
        options?: TCacheGetSetCbOptionsRaw<T>,
    ): Promise<TStoredDataRaw<T>>;
    getSet<T>(
        key: string,
        value: T | Promise<T>,
        options?: TCacheGetSetValueOptions,
    ): Promise<T | undefined>;

    async getSet<T>(
        key: string,
        valueOrCb: T | Promise<T> | (() => T | Promise<T>),
        options?: unknown,
    ): Promise<any> {
        try {
            if (typeof valueOrCb === 'function') {
                const fn = valueOrCb as () => T | Promise<T>;
                const opts = options as
                    | TCacheGetSetCbOptions<T>
                    | TCacheGetSetCbOptionsRaw<T>;

                this.logger.debug({
                    eventName: 'CacheManager.getSet.callback',
                    body: { key },
                });

                return this.cacheManager.wrap(key, fn, opts);
            }

            const cached = await this.get<T>(key);
            if (cached !== undefined && cached !== null) {
                this.logger.debug({
                    eventName: 'CacheManager.getSet.cacheHit',
                    body: { key },
                });
                return cached;
            }

            const value = await valueOrCb;
            const opts = options as TCacheGetSetValueOptions;

            await this.set<T>(key, value, opts);

            this.logger.debug({
                eventName: 'CacheManager.getSet.cacheMiss',
                body: { key },
            });

            return value;
        } catch (error) {
            this.logger.error({
                eventName: 'CacheManager.getSet.error',
                body: {
                    key,
                    error: error instanceof Error ? error.message : error,
                },
            });
            throw error;
        }
    }

    async del(key: string): Promise<boolean> {
        try {
            const result = await this.cacheManager.del(key);
            this.logger.debug({
                eventName: 'CacheManager.del',
                body: { key, success: result },
            });
            return result;
        } catch (error) {
            this.logger.error({
                eventName: 'CacheManager.del.error',
                body: {
                    key,
                    error: error instanceof Error ? error.message : error,
                },
            });
            throw error;
        }
    }

    async mdel(keys: string[]): Promise<boolean> {
        try {
            const result = await this.cacheManager.mdel(keys);
            this.logger.debug({
                eventName: 'CacheManager.mdel',
                body: { keys, count: keys.length, success: result },
            });
            return result;
        } catch (error) {
            this.logger.error({
                eventName: 'CacheManager.mdel.error',
                body: {
                    keys,
                    error: error instanceof Error ? error.message : error,
                },
            });
            throw error;
        }
    }
}

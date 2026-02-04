import { Module } from '@nestjs/common';
import { CacheManager } from './cache-manager';
import { cachingConfig } from './cache.config';
import { ConfigService, type ConfigType } from '@nestjs/config';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';

@Module({
    imports: [
        NestCacheModule.registerAsync({
            isGlobal: true,
            inject: [ConfigService],
            useFactory(config:ConfigService) {
                return {
                    ttl: config.get('caching.defaultTTL'),
                };
            },
        }),
    ],
    providers: [CacheManager],
    exports: [CacheManager],
})
export class CacheModule {}

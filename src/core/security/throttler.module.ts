import { Module } from '@nestjs/common';
import {
    ThrottlerGuard,
    ThrottlerModule,
    ThrottlerOptions,
} from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

@Module({
    imports: [
        ThrottlerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                throttlers: getThrottlerConfig(config),
            }),
        }),
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
    exports: [ThrottlerModule],
})
export class CoreThrottlerModule {}

function getThrottlerConfig(config: ConfigService): ThrottlerOptions[] {
    return ['SHORT', 'MEDIUM', 'LONG'].map((type) => ({
        name: type,
        ttl: Number(config.get(`THROTTLER_GENERAL_${type}_TTL`)),
        limit: Number(config.get(`THROTTLER_GENERAL_${type}_LIMIT`)),
    }));
}

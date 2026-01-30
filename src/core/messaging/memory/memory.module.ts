import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemoryMessagingDriver } from './memory.driver';

export const MEMORY_DRIVER = 'MEMORY_DRIVER';

@Module({
    providers: [
        {
            provide: MEMORY_DRIVER,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return new MemoryMessagingDriver({
                    retryPolicy: {
                        maxRetries: config.get<number>('memory.retryPolicy.maxRetries', 3),
                        delayTiers: config.get<number[]>('memory.retryPolicy.delayTiers', [5000, 30000, 300000]),
                    },
                });
            },
        },
    ],
    exports: [MEMORY_DRIVER],
})
export class MemoryMessagingModule {}

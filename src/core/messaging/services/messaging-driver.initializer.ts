import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MessageEnvelope, MessagingDriver, PublishOptions, SubscribeOptions } from '../interfaces';
import { MessagingDriverRegistry } from '../messaging-driver.registry';
import { MessagingService } from './messaging.service';
import { MEMORY_DRIVER } from '../memory/memory.module';
import { MemoryMessagingDriver } from '../memory/memory.driver';
import { MessagingManager } from '../messaging.manager';
@Injectable()
export class MessagingDriverInitializer implements OnApplicationBootstrap {
    constructor(
        private readonly config: ConfigService,
        private readonly registry: MessagingDriverRegistry,
        private readonly messagingService: MessagingService,
        @Inject(MEMORY_DRIVER) private readonly memoryDriver: MemoryMessagingDriver,
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        const enabled = this.config.get<boolean>('messaging.enabled', true);

        if (!enabled) {
            const noop = new NoopMessagingDriver();
            this.registry.register(noop.name, noop);
            await this.registry.init(noop.name);
            MessagingManager.registerFactory(() => this.messagingService);
            return;
        }
        const chosen = this.config.get<string>('messaging.driver', 'memory');

        this.registry.register('memory', this.memoryDriver);


        if (!this.registry.has(chosen)) {
            const available = this.registry.list();
            throw new Error(
                `Messaging driver "${chosen}" is not registered or is not enabled. Available drivers: ${available.length ? available.join(', ') : '(none)'}`,
            );
        }

        await this.registry.init(chosen);
        MessagingManager.registerFactory(() => this.messagingService);
    }
}

class NoopMessagingDriver implements MessagingDriver {
    name = 'noop';

    async connect(): Promise<void> {}
    async disconnect(): Promise<void> {}

    async publish(
        _envelope: MessageEnvelope,
        _options?: PublishOptions,
    ): Promise<void> {}

    async subscribe(
        _topic: string,
        _handler: (envelope: MessageEnvelope) => Promise<void>,
        _options?: SubscribeOptions,
    ): Promise<void> {}
}

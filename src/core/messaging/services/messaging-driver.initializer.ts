import { Inject, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagingDriverRegistry } from '../messaging-driver.registry';
import { MEMORY_DRIVER } from '../memory/memory.module';
import { MemoryMessagingDriver } from '../memory/memory.driver';
import { MessageEnvelope, MessagingDriver, PublishOptions, SubscribeOptions } from '../interfaces';

export class MessagingDriverInitializer implements OnApplicationBootstrap {
  constructor(
    private readonly config: ConfigService,
    private readonly registry: MessagingDriverRegistry,
    // private readonly messagingService: MessagingService,
    @Inject(MEMORY_DRIVER) private readonly memoryDriver: MemoryMessagingDriver,
  ) {}

  async onApplicationBootstrap() {
    const enabled = this.config.get<boolean>('messaging.enabled', true);
    if(!enabled){
        const noop=new NoopMessagingDriver();
        await this.registry.init(noop.name);
        return
    }
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

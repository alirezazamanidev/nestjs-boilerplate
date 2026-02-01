// messaging-subscriber.explorer.ts
import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';

import { SUBSCRIBE_METADATA, SUBSCRIBER_CLASS } from './messaging.constants';
import { MessagingService } from './services/messaging.service';
import { SubscribeMetadata } from './decorators/subscribe.decorator';
import { MessageEnvelope } from './interfaces';
import { MessagingManager } from './messaging.manager';

@Injectable()
export class MessagingSubscriberExplorer implements OnApplicationBootstrap {
    private messagingManager=MessagingManager.resolveService();
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
    
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const providers = this.discovery
      .getProviders()
      .filter(
        (wrapper) =>
          wrapper.instance &&
          wrapper.metatype &&
          this.reflector.get<boolean>(SUBSCRIBER_CLASS, wrapper.metatype),
      );

    for (const wrapper of providers) {
      await this.exploreProvider(wrapper.instance);
    }
  }

 private async exploreProvider(instance: Record<string, any>) {
  const prototype = Object.getPrototypeOf(instance);
  const descriptors = Object.getOwnPropertyDescriptors(prototype);

  for (const [methodName, descriptor] of Object.entries(descriptors)) {
    if (methodName === 'constructor') continue;
    const method = descriptor.value;
    if (typeof method !== 'function') continue;
    const metadata = this.reflector.get<SubscribeMetadata>(
      SUBSCRIBE_METADATA,
      method,
    );
    if (!metadata) continue;

    await this.registerHandler(instance, method, metadata);
  }
}


  private async registerHandler(
    instance: any,
    method: (payload:MessageEnvelope) => Promise<void>,
    metadata: SubscribeMetadata,
  ): Promise<void> {

    
    await this.messagingManager.subscribe(
      metadata.topic,
      async(payload:MessageEnvelope)=> {
        method.call(instance,payload)
      },
      metadata.options,
    );
  }
}

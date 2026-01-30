import { Injectable } from '@nestjs/common';
import type { MessageEnvelope, PublishOptions, SubscribeOptions } from '../interfaces/message-envelope';
import { LoggerManager } from 'src/core/logger/logger.manager';
import { MessagingDriverRegistry } from '../messaging-driver.registry';


@Injectable()
export class MessagingService {
    private readonly logger = LoggerManager.resolveLogger({
        context: 'MessagingService',
    });

    constructor(
        private readonly driverRegistry: MessagingDriverRegistry,
    ) {}

    // @Trace()
    async publish(envelope: MessageEnvelope, options?: PublishOptions): Promise<void> {
        const driver = this.driverRegistry.getCurrentDriver();
        await driver.publish(envelope, options);
    }

    // @Trace()
    async subscribe(
        topic: string,
        handler: (envelope: MessageEnvelope) => Promise<void>,
        options?: SubscribeOptions,
    ): Promise<void> {
        const driver = this.driverRegistry.getCurrentDriver();
        await driver.subscribe(topic, handler, options);
        this.logger.debug({
            eventName: 'messaging.service.topic.subscribed',
            body: {
                msg: 'Subscribed to topic',
                topic,
            },
        });
    }
}
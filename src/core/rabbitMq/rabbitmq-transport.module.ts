import { Inject, Injectable, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagingDriverRegistry } from '../messaging/messaging-driver.registry';
import type { MessagingDriver } from '../messaging/interfaces';
import { RabbitMessagingDriver } from '../messaging/rabbitmq/rabbit-messaging.driver';
import { MessagingModule } from '../messaging';
import { RabbitMqConnctionModule } from './rabbitmq-connection.module';

@Injectable()
class RabbitmqTransportRegistrar implements OnModuleInit {
    constructor(
        private readonly config: ConfigService,

        private readonly messagingRegistry: MessagingDriverRegistry,
        private readonly rabbitMessagingDriver: RabbitMessagingDriver,
    ) {}

    onModuleInit(): void {
     

       
        this.messagingRegistry.register('rabbit', this.rabbitMessagingDriver);
    }
}

@Module({
    imports: [MessagingModule,RabbitMqConnctionModule],
    providers: [RabbitmqTransportRegistrar, RabbitMessagingDriver],
})
export class RabbitmqTransportModule {}

import { Global, Module } from "@nestjs/common";
import { MemoryMessagingModule } from "./memory/memory.module";
import { MessagingDriverRegistry } from "./messaging-driver.registry";
import { MessagingService } from "./services/messaging.service";
import { MessagingDriverInitializer } from "./services/messaging-driver.initializer";
import { MessagingManager } from "./messaging.manager";
import { RabbitMqConnectionManager } from "../rabbitMq/rabbitMq-connection.service";
import { RabbitmqTransportModule } from "../rabbitMq/rabbitmq-transport.module";

@Global()
@Module({
    imports:[MemoryMessagingModule],
    providers:[
        MessagingDriverRegistry,
        MessagingService,
        MessagingDriverInitializer,
        RabbitMqConnectionManager,
      
        {
            provide:MessagingManager,
            inject:[MessagingService],
            useFactory:(service:MessagingService)=>new MessagingManager(service)
        }
    ],
    exports:[MessagingManager,MessagingDriverRegistry,MessagingService]
})
export class MessagingModule {}
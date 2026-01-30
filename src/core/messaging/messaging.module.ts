import { DynamicModule, Global, Module } from "@nestjs/common";
import { MemoryMessagingModule } from "./memory/memory.module";
import { MessagingDriverRegistry } from "./messaging-driver.registry";
import { MessagingService } from "./services/messaging.service";
import { MessagingDriverInitializer } from "./services/messaging-driver.initializer";
import { MessagingManager } from "./messaging-manager";

@Global()
@Module({})
export class MessagingModule {

    static forRootAsync():DynamicModule {
        return {
            module:MessagingModule,
            imports:[MemoryMessagingModule],
            providers:[
                MessagingDriverRegistry,
                MessagingService,
                MessagingDriverInitializer,
                {
                    provide:MessagingManager,
                    inject:[MessagingService],
                    useFactory:(service:MessagingService)=>new MessagingManager(service)
                }
            ]
        }
    }
}
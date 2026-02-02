import { Global, Module } from '@nestjs/common';
import { MemoryMessagingModule } from './memory/memory.module';
import { MessagingDriverRegistry } from './messaging-driver.registry';
import { MessagingService } from './services/messaging.service';
import { MessagingDriverInitializer } from './services/messaging-driver.initializer';
import { MessagingManager } from './messaging.manager';
import { RabbitMqConnectionManager } from '../rabbitMq/rabbitMq-connection.service';
import { RabbitmqTransportModule } from '../rabbitMq/rabbitmq-transport.module';
import { MessagingSubscriberExplorer } from './messaging-subscriber.explorer';
import { DiscoveryModule } from '@nestjs/core';
import { OutboxProcessor } from './outbox/outbox.proceassor';
import { OutboxService } from './outbox/outbox.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutBoxEntity } from './outbox/outbux.entity';

@Global()
@Module({
  imports: [
    MemoryMessagingModule,
    DiscoveryModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([OutBoxEntity]),
  ],
  providers: [
    MessagingDriverRegistry,
    MessagingService,
    MessagingDriverInitializer,
    RabbitMqConnectionManager,
    MessagingSubscriberExplorer,

    {
      provide: MessagingManager,
      inject: [MessagingService],
      useFactory: (service: MessagingService) => new MessagingManager(service),
    },
    OutboxProcessor,
    OutboxService,
  ],
  exports: [
    MessagingManager,
    MessagingDriverRegistry,
    MessagingService,
    OutboxService,
  ],
})
export class MessagingModule {}

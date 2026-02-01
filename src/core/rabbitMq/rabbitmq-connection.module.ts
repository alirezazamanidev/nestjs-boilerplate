import { Global, Module } from '@nestjs/common';
import { RabbitMqConnectionManager } from './rabbitMq-connection.service';

@Module({
  providers: [RabbitMqConnectionManager],
  exports:[RabbitMqConnectionManager]
})
export class RabbitMqConnctionModule {}

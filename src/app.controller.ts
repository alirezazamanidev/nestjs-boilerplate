import { Controller, Get, OnModuleInit, UseGuards } from '@nestjs/common';
import { MessageEnvelope, MessagingManager } from './core/messaging';
@Controller()
export class AppController implements OnModuleInit {
  private messaging = MessagingManager.resolveService();
  onModuleInit() {
    this.messaging.subscribe(
      'test',
      async (payload: MessageEnvelope) => {
        console.log(payload);
      },
      {
        exchange: 'event.test',
        exchangeType: 'direct',
      },
    );
  }
  @Get('/check')
  async check() {
    await this.messaging.publish({
      id: 'id',
      exchange: 'event.test',
      routingKey: 'test',
      exchangeType: 'direct',
      payload: {
        message: 'hello',
      },

      timestamp: new Date(),
    },{
        exchange:"event.test"
    });
    return 'ok';
  }
}

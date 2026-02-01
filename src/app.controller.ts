import { Controller, Get, OnModuleInit, UseGuards } from '@nestjs/common';
import { MessageEnvelope, MessagingManager } from './core/messaging';
@Controller()
export class AppController {
  private messaging = MessagingManager.resolveService();

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

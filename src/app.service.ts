import { Injectable } from '@nestjs/common';
import { Subscribe } from './core/messaging/decorators/subscribe.decorator';
import type { MessageEnvelope } from './core/messaging';

@Injectable()
export class AppService {
  @Subscribe('test', { exchange: 'event.test', exchangeType: 'direct' })
  async handle(payload: MessageEnvelope): Promise<void> {
    console.log('MESSAGE RECEIVED:', payload);
  }
}

import { Injectable } from '@nestjs/common';
import { LoggerManager } from 'src/core/logger/logger.manager';
import { OutboxService } from './outbox.service';
import { Cron, CronExpression } from '@nestjs/schedule';
@Injectable()
export class OutboxProcessor {
  private readonly logger = LoggerManager.resolveLogger({
    context: 'OutboxProcessor',
  });
  constructor(private readonly outboxService: OutboxService) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    disabled:
      process.env.OUTBOX_PROCESSOR_ENABLED === 'false' ||
      process.env.MESSAGING_ENABLED === 'false' ||
      process.env.MESSAGING_ENABLED === '0',
  })
  async handleCorn() {
    try {
      await this.outboxService.processPending();
      this.logger.debug({
        eventName: 'outbox.processor.processed',
        body: { msg: 'Processed pending outbox messages' },
      });
    } catch (error) {
      this.logger.error({
        eventName: 'outbox.processor.error',
        body: { msg: 'Error processing outbox messages', error },
      });
    }
  }
}

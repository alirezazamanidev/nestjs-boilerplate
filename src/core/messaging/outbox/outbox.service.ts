import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggerManager } from 'src/core/logger/logger.manager';
import { OutBoxEntity, OutboxStatus } from './outbux.entity';
import { Repository } from 'typeorm';
import { MessagingService } from '../services/messaging.service';
import { MessageEnvelope, PublishOptions } from '../interfaces';

@Injectable()
export class OutboxService {
  private readonly logger = LoggerManager.resolveLogger({
    context: 'OutboxService',
  });
  private readonly maxRetries = 3;
  constructor(
    @InjectRepository(OutBoxEntity)
    private readonly outboxRepository: Repository<OutBoxEntity>,
    private readonly messagingService: MessagingService,
  ) {}
  async enqueueMany(
    items: Array<{ envelope: MessageEnvelope; options?: PublishOptions }>,
  ) {
    if (!items.length) return;
    const entries = this.outboxRepository.create(
      items.map(({ envelope, options }) => ({
        routingKey: envelope.routingKey,
        payload: envelope.payload,
        status: OutboxStatus.PENDING,
        exchangeType: options?.exchangeType || null,
        exchangeOptions: options
          ? {
              exchange: options.exchange,
              headers: options.headers,
              correlationId: options.correlationId,
            }
          : null,
      })),
    );

    await this.outboxRepository.save(entries);
    this.logger.debug({
      eventName: 'outbox.message.enqueued',
      body: {
        msg: 'Messages enqueued to outbox',
        count: items.length,
        routingKeys: [
          ...new Set(items.map(({ envelope }) => envelope.routingKey)),
        ],
      },
    });
  }
  async enqueue(
    envelope: MessageEnvelope,
    options?: PublishOptions,
  ): Promise<void> {
    const outboxEntry = this.outboxRepository.create({
      routingKey: envelope.routingKey,
      payload: envelope.payload,
      status: OutboxStatus.PENDING,
      exchangeType: options?.exchangeType || null,
      exchangeOptions: options
        ? {
            exchange: options.exchange,
            headers: options.headers,
            correlationId: options.correlationId,
          }
        : null,
    });
    await this.outboxRepository.save(outboxEntry);
    this.logger.debug({
      eventName: 'outbox.message.enqueued',
      body: {
        msg: 'Message enqueued to outbox',
        routingKey: envelope.routingKey,
        id: envelope.id,
      },
    });
  }

  async processPending(): Promise<void> {
    const pendingMessages = await this.outboxRepository.find({
      where: { status: OutboxStatus.PENDING },
    });

    for (const message of pendingMessages) {
      try {
        const publishOptions: PublishOptions | undefined =
          message.exchangeOptions || message.exchangeType
            ? {
                ...(message.exchangeOptions ?? {}),
                ...(message.exchangeType
                  ? {
                      exchangeType: message.exchangeType as any,
                    }
                  : {}),
              }
            : undefined;

        await this.messagingService.publish(
          {
            id: `outbox-${message.id}`,
            routingKey: message.routingKey,
            payload: message.payload,
            timestamp: message.createdAt,
          },
          publishOptions,
        );

        message.status = OutboxStatus.SENT;
        message.sentAt = new Date();
        this.logger.debug({
          eventName: 'outbox.message.sent',
          body: {
            msg: 'Message sent from outbox',
            id: message.id,
            routingKey: message.routingKey,
          },
        });
      } catch (error) {
        message.retryCount += 1;
        if (message.retryCount >= this.maxRetries) {
          message.status = OutboxStatus.FAILED;
          this.logger.error({
            eventName: 'outbox.message.failed',
            body: {
              msg: 'Message failed after max retries',
              id: message.id,
              error,
            },
          });
        } else {
          this.logger.warn({
            eventName: 'outbox.message.retry',
            body: {
              msg: 'Message retry',
              id: message.id,
              retryCount: message.retryCount,
              error,
            },
          });
        }
      }
      await this.outboxRepository.save(message);
    }
  }
}

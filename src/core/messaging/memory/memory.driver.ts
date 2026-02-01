import { Injectable } from '@nestjs/common';
import { MessagingDriver } from '../interfaces';
import type {
  MessageEnvelope,
  PublishOptions,
  SubscribeOptions,
  ExchangeType,
  RetryPolicy,
} from '../interfaces';
import { EventEmitter } from 'events';
import { LoggerManager } from '../../logger/logger.manager';

interface Subscription {
  topic: string;
  exchange: string;
  exchangeType: ExchangeType;
  bindingHeaders?: Record<string, any>;
  handler: (envelope: MessageEnvelope) => Promise<void>;
  retryPolicy: RetryPolicy;
}

@Injectable()
export class MemoryMessagingDriver implements MessagingDriver {
  name = 'memory';
  private emitter = new EventEmitter();
  private subscriptions: Subscription[] = []; // For pub/sub with exchange routing
  private readonly logger = LoggerManager.resolveLogger({
    context: 'MemoryMessagingDriver',
  });
  private defaultRetryPolicy: RetryPolicy;

  constructor(config?: { retryPolicy?: Partial<RetryPolicy> }) {
    this.defaultRetryPolicy = {
      maxRetries: config?.retryPolicy?.maxRetries ?? 3,
      delayTiers: config?.retryPolicy?.delayTiers ?? [5000, 30000, 300000],
    };
  }

  async connect(): Promise<void> {}

  async disconnect(): Promise<void> {
    this.emitter.removeAllListeners();
    this.subscriptions = [];
  }

  async publish(
    envelope: MessageEnvelope,
    options?: PublishOptions,
  ): Promise<void> {
    if (!options?.exchange) {
      throw new Error(
        'Exchange must be specified in PublishOptions for Memory driver',
      );
    }

    const exchange = options.exchange;
    const exchangeType = options.exchangeType || 'direct';
    const routingKey = envelope.routingKey;
    const publishHeaders = options?.headers;

    for (const subscription of this.subscriptions) {
      if (
        subscription.exchange === exchange &&
        this.isRouteMatch(
          exchangeType,
          routingKey,
          subscription.topic,
          publishHeaders,
          subscription.bindingHeaders,
        )
      ) {
        await this.processMessageWithRetry(
          envelope,
          subscription.handler,
          subscription.retryPolicy,
          subscription.topic,
          0,
        );
      }
    }
  }

  /**
   * Process message with retry logic using fixed delay tiers
   */
  private async processMessageWithRetry(
    envelope: MessageEnvelope,
    handler: (envelope: MessageEnvelope) => Promise<void>,
    retryPolicy: RetryPolicy,
    topic: string,
    retryCount: number,
  ): Promise<void> {
    try {
      await handler(envelope);
      this.logger.debug({
        eventName: 'memory.message.processed',
        body: {
          msg: 'Message processed successfully',
          topic,
          retryCount,
        },
      });
    } catch (error) {
      this.logger.error({
        eventName: 'memory.message.error',
        body: {
          msg: 'Error processing message',
          error: error.message,
          topic,
          retryCount,
        },
      });

      if (retryCount < retryPolicy.maxRetries) {
        const tierIndex = Math.min(
          retryCount,
          retryPolicy.delayTiers.length - 1,
        );
        const delay = retryPolicy.delayTiers[tierIndex];
        const newRetryCount = retryCount + 1;

        this.logger.warn({
          eventName: 'memory.message.retry.scheduled',
          body: {
            msg: 'Scheduling retry',
            topic,
            retryCount: newRetryCount,
            tier: tierIndex + 1,
            delay,
          },
        });

        setTimeout(() => {
          this.processMessageWithRetry(
            envelope,
            handler,
            retryPolicy,
            topic,
            newRetryCount,
          );
        }, delay);
      } else {
        this.logger.error({
          eventName: 'memory.message.discarded',
          body: {
            msg: 'Message discarded after max retries',
            topic,
            retryCount,
            maxRetries: retryPolicy.maxRetries,
            error: error.message,
            payload: envelope.payload,
            messageId: envelope.id,
            routingKey: envelope.routingKey,
            timestamp: envelope.timestamp,
          },
        });
      }
    }
  }

  async subscribe(
    topic: string,
    handler: (envelope: MessageEnvelope) => Promise<void>,
    options?: SubscribeOptions,
  ): Promise<void> {
    const retryPolicy: RetryPolicy = {
      maxRetries:
        options?.retryPolicy?.maxRetries ?? this.defaultRetryPolicy.maxRetries,
      delayTiers:
        options?.retryPolicy?.delayTiers ?? this.defaultRetryPolicy.delayTiers,
    };

    if (!options?.exchange) {
      throw new Error(
        'Exchange must be specified in SubscribeOptions for Memory driver',
      );
    }

    const exchange = options.exchange;
    const exchangeType = options.exchangeType || 'direct';

    this.subscriptions.push({
      topic,
      exchange,
      exchangeType,
      bindingHeaders: options?.bindingHeaders,
      handler,
      retryPolicy,
    });

    this.logger.debug({
      eventName: 'memory.topic.subscribed',
      body: {
        msg: 'Subscribed to topic in memory with retry policy',
        topic,
        retryPolicy,
      },
    });
  }

  private isRouteMatch(
    exchangeType: ExchangeType,
    publishKey: string,
    bindingKey: string,
    publishHeaders?: Record<string, any>,
    bindingHeaders?: Record<string, any>,
  ): boolean {
    switch (exchangeType) {
      case 'fanout':
        return true; // Fanout ignores routing key

      case 'direct':
        return publishKey === bindingKey;

      case 'topic':
        return this.matchTopicPattern(publishKey, bindingKey);

      case 'headers':
        return this.matchHeaders(publishHeaders, bindingHeaders);

      default:
        return false;
    }
  }

  private matchTopicPattern(routingKey: string, pattern: string): boolean {
    const regexPattern = pattern
      .split('.')
      .map((part) => {
        if (part === '*') return '[^.]+';
        if (part === '#') return '.*';
        return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('\\.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(routingKey);
  }

  private matchHeaders(
    publishHeaders?: Record<string, any>,
    bindingHeaders?: Record<string, any>,
  ): boolean {
    if (!bindingHeaders) return true;
    if (!publishHeaders) return false;

    // Support x-match: all or any (default: all)
    const matchType = bindingHeaders['x-match'] || 'all';
    const headersToMatch = Object.entries(bindingHeaders).filter(
      ([key]) => key !== 'x-match',
    );

    if (headersToMatch.length === 0) return true;

    const matches = headersToMatch.filter(
      ([key, value]) => publishHeaders[key] === value,
    );

    return matchType === 'any'
      ? matches.length > 0
      : matches.length === headersToMatch.length;
  }
}

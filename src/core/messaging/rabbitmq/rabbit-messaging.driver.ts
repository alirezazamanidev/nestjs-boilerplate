import { Injectable } from '@nestjs/common';
import { ExchangeType, MessageEnvelope, MessagingDriver, PublishOptions, RetryPolicy, SubscribeOptions } from '../interfaces';
import { LoggerManager } from 'src/core/logger/logger.manager';
import { RabbitMqConnectionManager } from 'src/core/rabbitMq/rabbitMq-connection.service';

@Injectable()
export class RabbitMessagingDriver implements MessagingDriver {
  constructor(private readonly connectionManager: RabbitMqConnectionManager) {}
  name = 'rabbit';
  private exchangeCache = new Map<string, boolean>();
  private readonly logger = LoggerManager.resolveLogger({
    context: 'RabbitMessagingDriver',
  });

  async connect(): Promise<void> {
    await this.connectionManager.connect();
    this.logger.debug({
      eventName: 'rabbitmq.driver.initialized',
      body: {
        msg: 'RabbitMessagingDriver initialized',
      },
    });
  }
  async disconnect(): Promise<void> {
    this.exchangeCache.clear();
    this.logger.debug({
      eventName: 'rabbitmq.driver.cleaned',
      body: {
        msg: 'RabbitMessagingDriver cleaned up',
      },
    });
  }

    async publish(envelope: MessageEnvelope, options?: PublishOptions): Promise<void> {
        const channel = await this.connectionManager.getChannel();

        const routingKey = envelope.routingKey;
        const message = Buffer.from(JSON.stringify(envelope));

        if (!options?.exchange) {
            throw new Error('Exchange must be specified in PublishOptions for RabbitMQ driver');
        }

        const exchange = options.exchange;
        const exchangeType = (options.exchangeType || 'topic') as ExchangeType;

        await this.assertExchange(exchange, exchangeType);

        channel.publish(exchange, routingKey, message, {
            persistent: true,
            headers: options?.headers,
            correlationId: options?.correlationId,
        });

        this.logger.debug({
            eventName: 'rabbitmq.message.published',
            body: {
                msg: 'Message published to RabbitMQ',
                routingKey: envelope.routingKey,
                id: envelope.id,
                exchange: options?.exchange,
                exchangeType: options?.exchangeType,
          
            },
        });
    }

    async subscribe(
        topic: string,
        handler: (envelope: MessageEnvelope) => Promise<void>,
        options?: SubscribeOptions,
    ): Promise<void> {
  
        const channel = await this.connectionManager.getChannel();

        const retryPolicy: RetryPolicy = {
            maxRetries:
                options?.retryPolicy?.maxRetries ??
                this.connectionManager.getRetryPolicy().maxRetries,
            delayTiers:
                options?.retryPolicy?.delayTiers ??
                this.connectionManager.getRetryPolicy().delayTiers,
        };

        if (!options?.exchange) {
            throw new Error('Exchange must be specified in SubscribeOptions for RabbitMQ driver');
        }

        const exchange = options.exchange;
        const exchangeType = (options.exchangeType || 'topic') as ExchangeType;

        await this.assertExchange(exchange, exchangeType);

        const queueName = options?.queueName || '';
        const exclusive = options?.exclusive ?? queueName === '';
        const durable = options?.durable ?? false;

        if (durable && queueName) {
            await this.setupRetryQueues(queueName, retryPolicy);
        }

        const queue = await channel.assertQueue(queueName, {
            exclusive,
            durable,
        });

        await channel.bindQueue(queue.queue, exchange, topic, options?.bindingHeaders);

        await channel.consume(queue.queue, async (msg) => {
            if (msg) {
                const retryCount = this.getRetryCount(msg);

                try {
                    const envelope: MessageEnvelope = JSON.parse(msg.content.toString());
                    await handler(envelope);
                    channel.ack(msg);

                    this.logger.debug({
                        eventName: 'rabbitmq.message.processed',
                        body: {
                            msg: 'Message processed successfully',
                            topic,
                            retryCount,
                        },
                    });
                } catch (error) {
                    this.logger.error({
                        eventName: 'rabbitmq.message.error',
                        body: {
                            msg: 'Error processing message',
                            error: error.message,
                            topic,
                            retryCount,
                        },
                    });

                    if (durable && queueName) {
                        await this.handleRetry(channel, msg, queue.queue, retryPolicy, error, topic);
                    } else {
                        channel.ack(msg);
                        this.logger.warn({
                            eventName: 'rabbitmq.message.discarded.exclusive',
                            body: {
                                msg: 'Message discarded (no retry support for exclusive queue)',
                                topic,
                                error: error.message,
                            },
                        });
                    }
                }
            }
        });

        this.logger.debug({
            eventName: 'rabbitmq.topic.subscribed',
            body: {
                msg: 'Subscribed to topic in RabbitMQ with retry policy',
                topic,
                queueName: options?.queueName,
                exchangeType: options?.exchangeType,
                retryPolicy,
             
            },
        });
    }

  /**
   * Get retry count from message headers
   */
  private getRetryCount(msg: any): number {
    return msg.properties.headers?.['x-retry-count'] || 0;
  }
  private async assertExchange(exchange: string, type: ExchangeType) {
    const key = `${exchange}:${type}`;
    if (this.exchangeCache.has(key)) return;
    const channel = await this.connectionManager.getChannel();
    await channel.assertExchange(exchange, type, { durable: true });
    this.exchangeCache.set(key, true);
    this.logger.debug({
      eventName: 'rabbitmq.exchange.asserted',
      body: {
        msg: 'Exchange asserted',
        exchange,
        type,
      },
    });
  }

      /**
     * Handle message retry logic with fixed delay tiers
     */
    private async handleRetry(
        channel: any,
        msg: any,
        queueName: string,
        retryPolicy: RetryPolicy,
        error: any,
        topic: string,
    ): Promise<void> {
        const retryCount = this.getRetryCount(msg);

        if (retryCount < retryPolicy.maxRetries) {
            const tierIndex = Math.min(retryCount, retryPolicy.delayTiers.length - 1);
            const tier = tierIndex + 1;
            const delay = retryPolicy.delayTiers[tierIndex];
            const newRetryCount = retryCount + 1;

            const retryExchange = `${queueName}.retry`;
            const routingKey = `tier${tier}`;

            channel.publish(retryExchange, routingKey, msg.content, {
                persistent: true,
                headers: {
                    ...msg.properties.headers,
                    'x-retry-count': newRetryCount,
                },
            });

            channel.ack(msg);

            this.logger.warn({
                eventName: 'rabbitmq.message.retry.sent',
                body: {
                    msg: 'Message sent to retry queue',
                    topic,
                    queueName,
                    retryCount: newRetryCount,
                    tier,
                    delay,
                    error: error.message,
                },
            });
        } else {
            channel.ack(msg);

            this.logger.error({
                eventName: 'rabbitmq.message.discarded',
                body: {
                    msg: 'Message discarded after max retries',
                    topic,
                    queueName,
                    retryCount,
                    maxRetries: retryPolicy.maxRetries,
                    error: error.message,
                    payload: JSON.parse(msg.content.toString()),
                },
            });
        }
    }
  /**
   * Setup retry queues with fixed delay tiers
   * Creates separate queues for each retry tier with TTL
   */
  private async setupRetryQueues(
    originalQueue: string,
    retryPolicy: RetryPolicy,
  ) {
    const channel = await this.connectionManager.getChannel();
    const retryExchange = `${originalQueue}.retry`;

    await channel.assertExchange(retryExchange, 'direct', { durable: true });

    for (let tier = 0; tier < retryPolicy.delayTiers.length; tier++) {
      const retryQueueName = `${originalQueue}.retry.tier${tier + 1}`;
      const delay = retryPolicy.delayTiers[tier];

      await channel.assertQueue(retryQueueName, {
        durable: true,
        messageTtl: delay,
        deadLetterExchange: '', // Default exchange
        deadLetterRoutingKey: originalQueue,
      });

      await channel.bindQueue(retryQueueName, retryExchange, `tier${tier + 1}`);

      this.logger.debug({
        eventName: 'rabbitmq.retry.queue.created',
        body: {
          msg: 'Retry queue created',
          retryQueueName,
          delay,
          tier: tier + 1,
        },
      });
    }
  }
}

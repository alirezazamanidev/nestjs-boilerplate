import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqplib, { Channel } from 'amqplib';
import { LoggerManager } from '../logger/logger.manager';

interface ConnectionState {
  connection?: amqplib.ChannelModel;
  channel?: amqplib.Channel;
  isConnecting: boolean;
  connectionPromise?: Promise<void>;
}

@Injectable()
export class RabbitMqConnectionManager implements OnModuleDestroy {
  private readonly logger = LoggerManager.resolveLogger({
    context: 'RabbitMQConnectionManager',
  });

  private connectionData: ConnectionState = {
    isConnecting: false,
  };

  constructor(private readonly configService: ConfigService) {}

  /**
   * Establish connection (idempotent)
   */
  async connect(): Promise<void> {
    if (this.connectionData.connection && this.connectionData.channel) {
      return;
    }

    if (
      this.connectionData.isConnecting &&
      this.connectionData.connectionPromise
    ) {
      return this.connectionData.connectionPromise;
    }

    this.connectionData.isConnecting = true;
    this.connectionData.connectionPromise = this.doConnect();

    try {
      await this.connectionData.connectionPromise;
    } finally {
      this.connectionData.isConnecting = false;
      this.connectionData.connectionPromise = undefined;
    }
  }

  private async doConnect(): Promise<void> {
    const config = this.configService.get<{
      url: string;
      prefetch?: number;
    }>('rabbitmq');

    if (!config?.url) {
      throw new Error('RabbitMQ config.url is missing');
    }

    try {
      const connection = await amqplib.connect(config.url);
      const channel = await connection.createChannel();

      if (typeof config.prefetch === 'number') {
        await channel.prefetch(config.prefetch);
      }

      this.connectionData.connection = connection;
      this.connectionData.channel = channel;

      this.logger.info({
        eventName: 'rabbitmq.connected',
        body: {
          msg: 'Connected to RabbitMQ',
          url: config.url,
        },
      });

      connection.on('error', (error) => {
        this.logger.error({
          eventName: 'rabbitmq.connection.error',
          body: {
            msg: 'RabbitMQ connection error',
            error,
          },
        });
      });

      connection.on('close', () => {
        this.logger.warn({
          eventName: 'rabbitmq.connection.closed',
          body: {
            msg: 'RabbitMQ connection closed',
          },
        });

        this.connectionData.connection = undefined;
        this.connectionData.channel = undefined;
      });
    } catch (error) {
      this.connectionData.connection = undefined;
      this.connectionData.channel = undefined;

      this.logger.error({
        eventName: 'rabbitmq.connection.failed',
        body: {
          msg: 'Failed to connect to RabbitMQ',
          error,
        },
      });

      throw error;
    }
  }

  /**
   * Get channel (always valid)
   */
  async getChannel(): Promise<Channel> {
    if (!this.connectionData.channel) {
      await this.connect();
    }

    if (!this.connectionData.channel) {
      throw new Error('RabbitMQ channel is not available');
    }

    return this.connectionData.channel;
  }

  /**
   * Retry policy
   */
  getRetryPolicy(): {
    maxRetries: number;
    delayTiers: number[];
  } {
    const config = this.configService.get<{
      retryPolicy?: {
        maxRetries?: number;
        delayTiers?: number[];
      };
    }>('rabbitmq');

    return {
      maxRetries: config?.retryPolicy?.maxRetries ?? 3,
      delayTiers:
        config?.retryPolicy?.delayTiers ?? [5000, 30000, 300000],
    };
  }

  async onModuleDestroy(): Promise<void> {
    try {
      if (this.connectionData.channel) {
        await this.connectionData.channel.close();
        this.logger.debug({
          eventName: 'rabbitmq.channel.closed',
          body: { msg: 'RabbitMQ channel closed' },
        });
      }

      if (this.connectionData.connection) {
        await this.connectionData.connection.close();
        this.logger.info({
          eventName: 'rabbitmq.disconnected',
          body: { msg: 'Disconnected from RabbitMQ' },
        });
      }
    } catch (error) {
      this.logger.error({
        eventName: 'rabbitmq.disconnection.error',
        body: {
          msg: 'Error disconnecting from RabbitMQ',
          error,
        },
      });
    }
  }
}

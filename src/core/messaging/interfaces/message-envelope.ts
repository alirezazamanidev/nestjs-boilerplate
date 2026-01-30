export type ExchangeType = 'fanout' | 'direct' | 'topic' | 'headers';

export interface MessageEnvelope {
    id: string;
    routingKey: string;
    payload: any;
    timestamp: Date;
    headers?: Record<string, any>;
    mode?: 'pubsub' | 'queue';
    exchange?: string;
    exchangeType?: ExchangeType;
}

export interface PublishOptions {
    exchangeType?: ExchangeType;
    exchange?: string;
    headers?: Record<string, any>;
    correlationId?: string;
    connectionId?: string; // Which RabbitMQ connection to use (default: configured default)
}

export interface RetryPolicy {
    maxRetries: number;
    delayTiers: number[];
}

export interface SubscribeOptions {
    exchangeType?: ExchangeType;
    exchange?: string;
    bindingHeaders?: Record<string, any>;
    queueName?: string;
    durable?: boolean;
    exclusive?: boolean;
    retryPolicy?: Partial<RetryPolicy>;
    connectionId?: string; // Which RabbitMQ connection to use (default: configured default)
}

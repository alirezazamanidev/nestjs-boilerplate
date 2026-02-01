import { MessageEnvelope, PublishOptions, SubscribeOptions } from './message-envelope';

/**
 * Represents a unified contract for messaging drivers.
 * Each driver should implement these methods to provide
 * consistent publish/subscribe behavior across different messaging systems.
 */
export interface MessagingDriver {
    /**
     * Establishes a connection to the messaging system.
     */
    connect(): Promise<void>;

    /**
     * Closes the current messaging connection.
     */
    disconnect(): Promise<void>;

    /**
     * Publishes a message to the specified topic.
     * @param envelope - The message envelope to publish.
     * @param options - Optional publish options including exchange type, headers, etc.
     * @returns A promise that resolves when the message is published.
     */
    publish(envelope: MessageEnvelope, options?: PublishOptions): Promise<void>;

    /**
     * Subscribes to messages on the specified topic using pubsub patterns.
     * @param topic - The topic/routing key to subscribe to.
     * @param handler - The function to handle incoming messages.
     * @param options - Optional subscribe options including exchange type, queue settings, etc.
     * @returns A promise that resolves when the subscription is set up.
     */
    subscribe(
        topic: string,
        handler: (envelope: MessageEnvelope) => Promise<void>,
        options?: SubscribeOptions,
    ): Promise<void>;
}

import { MessagingService } from './services/messaging.service';
import { MemoryMessagingDriver } from './memory/memory.driver';
import { MessagingDriverRegistry } from './messaging-driver.registry';

export class MessagingManager {
    constructor(private readonly messagingService: MessagingService) {}

    private static _factory?: () => MessagingService;
    private static fallbackService?: MessagingService;

    static registerFactory(factory: () => MessagingService) {
        this._factory = factory;
    }

    service(): MessagingService {
        return this.messagingService;
    }

    static resolveService(): MessagingService {
        if (this._factory) return this._factory();
        if (!this.fallbackService) {
            this.fallbackService = this.createFallbackService();
        }
        return this.fallbackService;
    }

    static tryResolveService(): MessagingService | null {
        try {
            return this.resolveService();
        } catch {
            return null;
        }
    }

    private static createFallbackService(): MessagingService {
        const registry = new MessagingDriverRegistry();
        const memoryDriver = new MemoryMessagingDriver();
        registry.register(memoryDriver.name, memoryDriver);
        registry.use(memoryDriver.name);
        void memoryDriver.connect();
        return new MessagingService(registry);
    }
}

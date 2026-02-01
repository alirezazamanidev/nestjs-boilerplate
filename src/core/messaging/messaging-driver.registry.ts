import { Injectable } from '@nestjs/common';
import { MessagingDriver } from './interfaces';

@Injectable()
export class MessagingDriverRegistry {
    private drivers = new Map<string, MessagingDriver>();
    private current?: { name: string; driver: MessagingDriver };

    register(name: string, driver: MessagingDriver) {
        this.drivers.set(name, driver);
    }

    has(name: string): boolean {
        return this.drivers.has(name);
    }

    list() {
        return [...this.drivers.keys()];
    }

    async init(name: string) {
        const drv = this.drivers.get(name);
        if (!drv) throw new Error(`Messaging driver not found: ${name}`);
        await drv.connect();
        this.current = { name, driver: drv };
    }

    use(name: string) {
        const drv = this.drivers.get(name);
        if (!drv) throw new Error(`Messaging driver not found: ${name}`);
        this.current = { name, driver: drv };
    }

    getCurrentDriver(): MessagingDriver {
        if (!this.current) {
            const first = this.drivers.entries().next().value as
                | [string, MessagingDriver]
                | undefined;
            if (!first) throw new Error('Messaging driver not initialized');
            const [name, driver] = first;
            this.current = { name, driver };
        }
        return this.current.driver;
    }

    async switchTo(name: string) {
        const next = this.drivers.get(name);
        if (!next) throw new Error(`Unknown messaging driver: ${name}`);
        const prev = this.current;
        await next.connect();
        this.current = { name, driver: next };
        await prev?.driver.disconnect();
    }

    async disconnect() {
        if (this.current) {
            await this.current.driver.disconnect();
            this.current = undefined;
        }
    }
}

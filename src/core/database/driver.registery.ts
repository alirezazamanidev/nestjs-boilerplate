import { Injectable } from '@nestjs/common';
import { DatabaseDriver } from './interfaces';

@Injectable()
export class DatabaseDriverRegistery {
  private drivers = new Map<string, DatabaseDriver>();
  private current?: DatabaseDriver | null = null;

  register(driver: DatabaseDriver) {
    if (!this.drivers.has(driver.name)) {
      this.drivers.set(driver.name, driver);
    }
  }
  async init(name: string) {
    const drv = this.drivers.get(name);
    if (!drv) throw new Error(`Database driver not found: ${name}`);
    await drv.connect();
    this.current = drv;
  }
  get currentDriver(): DatabaseDriver {
    if (!this.current) throw new Error('Messaging driver not initialized');
    return this.current;
  }
    async switchTo(name: string) {
        const next = this.drivers.get(name);
        if (!next) throw new Error(`Unknown messaging driver: ${name}`);
        const prev = this.current;
        await next.connect();
        this.current = next;
        await prev?.disconnect();
    }
    async disconnect() {
        if (this.current) {
            await this.current.disconnect();
            this.current = undefined;
        }
    }
}

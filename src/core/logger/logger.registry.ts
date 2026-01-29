import { Injectable } from '@nestjs/common';
import { AppLogger, LoggerDriver } from './logger.interface';

@Injectable()
export class LoggerDriverRegistery {
  private drivers = new Map<string, LoggerDriver>();
  private current?: { name: string; root: AppLogger; driver: LoggerDriver };

  register(driver:LoggerDriver){
    this.drivers.set(driver.name,driver);
  }
  list(){
    return [...this.drivers.keys()]
  }
    async init(name: string, cfg: any) {
        const drv = this.drivers.get(name);
        if (!drv) throw new Error(`Logger driver not found: ${name}`);
        const root = await drv.createRootLogger(cfg);
        this.current = { name: drv.name, root, driver: drv };
    }
      getRoot(): AppLogger {
        if (!this.current) throw new Error('Logger not initialized');
        return this.current.root;
    }

    getCurrentDriver(): LoggerDriver {
        if (!this.current) throw new Error('Logger not initialized');
        return this.current.driver;
    }
    

    async switchTo(name: string, cfg: any) {
        const next = this.drivers.get(name);
        if (!next) throw new Error(`Unknown driver: ${name}`);
        const prev = this.current;
        const nextRoot = await next.createRootLogger(cfg);
        this.current = { name: next.name, root: nextRoot, driver: next };
        try {
            const prevDrv = this.drivers.get(prev!.name)!;
            await prevDrv.close?.(prev!.root);
            await prevDrv.closeAllCustoms?.();
        } catch {
            // Ignore errors when closing previous driver
        }
    }
}

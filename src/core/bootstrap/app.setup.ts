import type { INestApplication } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { loadSetupInstances } from './index';

export async function setupApp(app: INestApplication) {
    const log = new Logger('Bootstrap');
    const setups = await loadSetupInstances();

    if (!setups.length) {
        log.warn('No setup modules found under core/bootstrap/setups');
        return;
    }

    for (const s of setups) {
        const enabled = (await s.isEnabled?.()) ?? true;
        if (!enabled) {
            log.log(`Skip setup: ${s.name} (disabled)`);
            continue;
        }
        const label = `setup:${s.name ?? 'unknown'}`;
        const started = Date.now();
        try {
            await s.setup(app);
            log.log(`Done ${label} in ${Date.now() - started}ms`);
        } catch (e: unknown) {
            const error = e as Error;
            log.error(`Failed ${label}: ${error?.message ?? String(e)}`);
            throw e;
        }
    }
}


import type { Logger as PinoBase } from 'pino';
import { AppLogger, BaseBindings, LogRecord } from '../logger/logger.interface';

export class PinoAppLogger implements AppLogger {
    constructor(private readonly root: PinoBase) {}

    asPino(): PinoBase {
        return this.root;
    }

    child(bindings?: BaseBindings): AppLogger {
        return new PinoAppLogger(this.root.child(bindings ?? {}));
    }
    trace(o: LogRecord) {
        const body = o.body ?? {};
        this.root.trace({ ...body, ...(o.bindings ?? {}) });
    }
    debug(o: LogRecord) {
        const body = o.body ?? {};
        this.root.debug({ ...body, ...(o.bindings ?? {}) });
    }
    info(o: LogRecord) {
        const body = o.body ?? {};
        this.root.info({ ...body, ...(o.bindings ?? {}) });
    }
    warn(o: LogRecord) {
        const body = o.body ?? {};
        this.root.warn({ ...body, ...(o.bindings ?? {}) });
    }
    error(o: LogRecord) {
        const body = o.body ?? {};
        this.root.error({ ...body, ...(o.bindings ?? {}) });
    }
    fatal(o: LogRecord) {
        const body = o.body ?? {};
        this.root.fatal({ ...body, ...(o.bindings ?? {}) });
    }
}

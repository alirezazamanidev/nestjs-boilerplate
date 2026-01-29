import type { AppLogger, BaseBindings, LogRecord } from './logger.interface';

export class ConsoleAppLogger implements AppLogger {
    constructor(private readonly bindings: BaseBindings = {}) {}

    private line(
        level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal',
        o: LogRecord,
    ) {
        const body = o.body ?? {};
        const rec = {
            ...this.bindings,
            ...body,
            ...(o.bindings ?? {}),
        } as Record<string, any>;
        const msg = typeof rec?.msg === 'string' ? rec.msg : undefined;
        const out = JSON.stringify({ level, ...rec, ...(msg ? {} : {}) });
        if (level === 'error' || level === 'fatal') {
            console.error(out);
        } else if (level === 'warn') {
            console.warn(out);
        } else {
            console.log(out);
        }
    }

    child(bindings?: BaseBindings): AppLogger {
        return new ConsoleAppLogger({ ...this.bindings, ...(bindings ?? {}) });
    }

    trace(o: LogRecord) {
        this.line('trace', o);
    }
    debug(o: LogRecord) {
        this.line('debug', o);
    }
    info(o: LogRecord) {
        this.line('info', o);
    }
    warn(o: LogRecord) {
        this.line('warn', o);
    }
    error(o: LogRecord) {
        this.line('error', o);
    }
    fatal(o: LogRecord) {
        this.line('fatal', o);
    }
    log(message: unknown, context?: string) {
        this.info({
            eventName: 'console.log',
            body: { msg: message, context },
        });
    }
}

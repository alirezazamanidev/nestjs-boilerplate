import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { LoggerManager } from './logger.manager';

@Injectable()
export class NestLoggerAdapter implements LoggerService {
    private enabledLevels?: Set<LogLevel>;

    log(message: any, context?: string) {
        if (this.enabledLevels && !this.enabledLevels.has('log')) return;
        this.emit('info', message, context);
    }

    error(message: any, traceOrError?: string | Error, c?: string) {
        if (this.enabledLevels && !this.enabledLevels.has('error')) return;

        if (traceOrError instanceof Error) {
            this.emit('error', traceOrError, c, { msg: String(message) });
        } else if (message instanceof Error) {
            this.emit('error', message, c);
        } else {
            const extra =
                typeof traceOrError === 'string'
                    ? { stack: traceOrError }
                    : undefined;
            this.emit('error', message, c, extra);
        }
    }

    warn(message: any, context?: string) {
        if (this.enabledLevels && !this.enabledLevels.has('warn')) return;
        this.emit('warn', message, context);
    }

    debug(message: any, context?: string) {
        if (this.enabledLevels && !this.enabledLevels.has('debug')) return;
        this.emit('debug', message, context);
    }

    verbose(message: any, context?: string) {
        if (this.enabledLevels && !this.enabledLevels.has('verbose')) return;
        this.emit('trace', message, context);
    }

    setLogLevels?(levels: LogLevel[]) {
        this.enabledLevels = new Set(levels);
    }

    private emit(
        level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
        message: any,
        context?: string,
        extra?: Record<string, unknown>,
    ) {
        const logger = LoggerManager.resolveLogger({
            context: context ?? 'nest',
        });

        let payload: Record<string, unknown> = {};

        //Error
        if (message instanceof Error) {
            payload = {
                msg: message.message ?? 'Error',
                name: message.name,
                stack: message.stack,
                error: message,
            };
        }

        //Object
        else if (typeof message === 'object' && message) {
            const raw = message as Record<string, unknown>;
            const { msg, message: innerMessage, stack, error, ...rest } = raw;

            let finalMsg =
                typeof msg === 'string'
                    ? msg
                    : typeof innerMessage === 'string'
                      ? innerMessage
                      : undefined;

            if (!finalMsg) {
                try {
                    finalMsg = JSON.stringify(message);
                } catch {
                    finalMsg = String(message);
                }
            }

            payload = {
                ...rest,
                msg: finalMsg,
                ...(stack ? { stack } : {}),
                ...(error instanceof Error ? { error } : {}),
            };
        }
        //String
        else {
            payload = { msg: String(message) };
        }
        // handle extra
        if (extra && typeof extra === 'object') {
            payload = { ...payload, ...extra };
        }

        // handle msg if not exists
        if (!payload.msg) payload.msg = '[no message]';

        const eventName = `nest.${context ?? 'unknown'}.${level}`;
        logger[level]({ eventName, body: payload });
    }
}

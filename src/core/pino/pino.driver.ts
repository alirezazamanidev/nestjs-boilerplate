import pino, { type Logger as PinoBase } from 'pino';


import { PinoAppLogger } from './pino.logger';
import { ConfigService } from '@nestjs/config';
import { Injectable, LogLevel } from '@nestjs/common';
import { AppLogger, CustomTransportSpec, LoggerDriver } from '../logger/logger.interface';
import { buildPinoOutput } from './pino.transports';


@Injectable()
export class PinoDriver implements LoggerDriver {
    readonly name = 'pino';

    constructor(
        private readonly root: PinoBase,
        private readonly cfg: ConfigService,
    ) {}

    createRootLogger(): AppLogger {
        return new PinoAppLogger(this.root);
    }

    private cache = new Map<string, AppLogger>();

    createCustomLogger(spec: CustomTransportSpec): AppLogger {
        const key = JSON.stringify(spec);
        const cached = this.cache.get(key);
        if (cached) return cached;

        const out = buildPinoOutput({ cfg: this.cfg, spec });
        const level =
            (spec?.level as LogLevel) ??
            this.cfg.get<string>('logger.level') ??
            'debug';
        const base =
            out.mode === 'stream'
                ? pino({ level }, out.stream)
                : pino({ level }, out.transport);

        const inst = new PinoAppLogger(base);
        this.cache.set(key, inst);
        return inst;
    }

    async close(_root: AppLogger): Promise<void> {
        // No cleanup needed
    }
    closeAllCustoms(): void {
        this.cache.clear();
    }
}

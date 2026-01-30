import type { IncomingMessage } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as NestPinoLoggerModule } from 'nestjs-pino';
import pino from 'pino';
import { PINO_LOGGER_DRIVER, PINO_ROOT } from './pino.provider';

import { createMultiTransport } from './pino.transports';
import { PinoDriver } from './pino.driver';
import { PinoAppLogger } from './pino.logger';
import { AppLogger } from '../logger/logger.interface';

@Global()
@Module({
    imports: [
        NestPinoLoggerModule.forRootAsync({
            inject: [ConfigService, PINO_ROOT],
            useFactory: (cfg: ConfigService, root: pino.Logger) => {
                const httpEnabled =
                    cfg.get<string>('logger.driver') === 'pino' &&
                    cfg.get<boolean>('pino.httpLogging');

                return {
                    pinoHttp: {
                        logger: root,
                        autoLogging: httpEnabled
                            ? {
                                  ignore: (req: IncomingMessage) =>
                                      /^\/(health|metrics)/.test(req.url ?? ''),
                              }
                            : false,
                        genReqId: (req: IncomingMessage) => {
                            if (req.id !== undefined) {
                                return typeof req.id === 'string'
                                    ? req.id
                                    : typeof req.id === 'number'
                                      ? String(req.id)
                                      : randomUUID();
                            }
                            return randomUUID();
                        },
                        customProps: (req: IncomingMessage) => ({
                            requestId:
                                req.id !== undefined
                                    ? typeof req.id === 'string'
                                        ? req.id
                                        : typeof req.id === 'number'
                                          ? String(req.id)
                                          : undefined
                                    : undefined,
                        }),
                    },
                };
            },
        }),
    ],
    providers: [
        {
            provide: PINO_ROOT,
            inject: [ConfigService],
            useFactory: pinoRootFactory,
        },
        {
            provide: PINO_LOGGER_DRIVER,
            inject: [PINO_ROOT, ConfigService],
            useFactory: (root: pino.Logger, cfg: ConfigService) =>
                new PinoDriver(root, cfg),
        },
        {
            provide: 'APP_LOGGER_ROOT',
            inject: [PINO_ROOT],
            useFactory: (root: pino.Logger): AppLogger =>
                new PinoAppLogger(root),
        },
    ],
    exports: [PINO_LOGGER_DRIVER, PINO_ROOT, 'APP_LOGGER_ROOT'],
})
export class PinoLoggerModule {}

function pinoRootFactory(cfg: ConfigService) {
    const level = cfg.get<string>('LOG_LEVEL') ?? 'info';

    const targets = [{ target: 'pino-pretty' }, { target: 'pino/file' }];

    const multiTransport = createMultiTransport(targets, cfg);
    return pino({ level }, multiTransport);
}

import type { ConfigService } from '@nestjs/config';

export const STDOUT = 1;

export function getDefaultTargetOptions(
    cfg?: ConfigService,
): Record<string, { level: string; options: Record<string, unknown> }> {
    const defaultDebugLevel =
        cfg?.get<string>('pino.defaultDebugLevel') ?? 'debug';
    const defaultErrorLevel =
        cfg?.get<string>('pino.defaultErrorLevel') ?? 'error';

    return {
        'pino-pretty': {
            level: defaultDebugLevel,
            options: {
                colorize: true,
                translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
                ignore: 'pid,hostname',
            },
        },
        'pino/file': {
            level: defaultErrorLevel,
            options: {
                destination: 'storage/logs/app.log',
                mkdir: true,
            },
        },
    };
}

export const TARGET_CONFIG_KEYS: Record<
    string,
    {
        level?: string;
        destination?: string;
    }
> = {
    'pino-pretty': {
        level: 'CONSOLE_LOG_LEVEL',
    },
    'pino/file': {
        level: 'FILE_LOG_LEVEL',
        destination: 'LOG_FILE_PATH',
    },
};

export const DEFAULT_ROTATION_CONFIG = {
    frequency: 'daily',
    maxLogs: 14,
    dateFormat: 'YYYY-MM-DD',
    auditFile: 'storage/logs/audit.json',
    destination: 'storage/logs/app-%DATE%.log',
};

export const DEFAULT_FILE_DESTINATION = 'storage/logs/app.log';

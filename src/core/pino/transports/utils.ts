import type { ConfigService } from '@nestjs/config';
import type { PinoKind } from './types';
import { getDefaultTargetOptions, TARGET_CONFIG_KEYS } from './constants';

export function normalizeKinds(input?: PinoKind[] | string): PinoKind[] {
    if (!input) return ['console'];
    if (Array.isArray(input)) return input;
    return input
        .toString()
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean) as PinoKind[];
}

export function resolveLevel(
    cfg?: ConfigService,
    specLevel?: string,
    isProd?: boolean,
): string {
    const defaultLevel = cfg?.get<string>('logger.level') ?? 'info';
    const defaultDebugLevel =
        cfg?.get<string>('pino.defaultDebugLevel') ?? 'debug';

    return (
        specLevel ??
        cfg?.get<string>('logger.level') ??
        (isProd ? defaultLevel : defaultDebugLevel)
    );
}

export function resolveTargetLevel(
    target: string,
    providedLevel: string | undefined,
    cfg?: ConfigService,
): string {
    if (providedLevel) return providedLevel;

    const configKey = TARGET_CONFIG_KEYS[target]?.level;
    if (configKey && cfg) {
        if (configKey === 'CONSOLE_LOG_LEVEL') {
            const configValue = cfg.get<string>('logger.consoleLogLevel');
            if (configValue) return configValue;
        } else if (configKey === 'FILE_LOG_LEVEL') {
            const configValue = cfg.get<string>('logger.fileLogLevel');
            if (configValue) return configValue;
        }
    }

    const defaultTargetOptions = getDefaultTargetOptions(cfg);
    const defaultLevel = cfg?.get<string>('logger.level') ?? 'info';
    return defaultTargetOptions[target]?.level ?? defaultLevel;
}

export function resolveTargetOptions(
    target: string,
    providedOptions: Record<string, unknown> | undefined,
    cfg?: ConfigService,
): Record<string, unknown> {
    const defaultTargetOptions = getDefaultTargetOptions(cfg);
    const defaultOptions = defaultTargetOptions[target]?.options ?? {};
    const resolvedOptions = { ...defaultOptions };

    if (providedOptions) {
        Object.assign(resolvedOptions, providedOptions);
    }

    const configKeys = TARGET_CONFIG_KEYS[target];
    if (configKeys?.destination && cfg && !resolvedOptions.destination) {
        if (configKeys.destination === 'LOG_FILE_PATH') {
            const configValue = cfg.get<string>('logger.filePath');
            if (configValue) {
                resolvedOptions.destination = configValue;
            }
        }
    }

    return resolvedOptions;
}

export function resolveConfigValue<T = string>(
    cfg: ConfigService | undefined,
    key: string,
    defaultValue: T,
): T {
    if (!cfg) return defaultValue;
    const value = cfg.get<T>(key);
    return value ?? defaultValue;
}

import type { ConfigService } from '@nestjs/config';

import type { BuildPinoOutputOptions, PinoOutput } from './types';
import {
    DEFAULT_ROTATION_CONFIG,
    DEFAULT_FILE_DESTINATION,
    STDOUT,
} from './constants';
import { createMultiTransport } from './core';
import { createFileRotator } from 'src/common/utils/file-rotation.utils';

export function buildFileRotationOutput(
    cfg: ConfigService | undefined,
    spec: BuildPinoOutputOptions['spec'],
): PinoOutput {
    const fileRotationSpec =
        spec && 'kind' in spec && spec.kind === 'file-rotation'
            ? spec
            : undefined;

    const destination =
        fileRotationSpec?.destination ??
        cfg?.get<string>('logger.defaultRotationDestination') ??
        DEFAULT_ROTATION_CONFIG.destination;

    const rotation = {
        frequency:
            cfg?.get<string>('logger.frequency') ??
            DEFAULT_ROTATION_CONFIG.frequency,
        maxLogs:
            cfg?.get<number>('logger.maxLogs') ??
            DEFAULT_ROTATION_CONFIG.maxLogs,
        dateFormat:
            cfg?.get<string>('logger.dateFormat') ??
            DEFAULT_ROTATION_CONFIG.dateFormat,
        auditFile:
            fileRotationSpec?.auditFile ??
            cfg?.get<string>('logger.auditFilePath') ??
            DEFAULT_ROTATION_CONFIG.auditFile,
    };

    const rotator = createFileRotator({
        filename: destination,
        frequency: rotation.frequency,
        maxLogs: rotation.maxLogs,
        dateFormat: rotation.dateFormat,
        auditFile: rotation.auditFile,
    });

    return { mode: 'stream', stream: rotator };
}

export function buildFileOutput(
    cfg: ConfigService | undefined,
    spec: BuildPinoOutputOptions['spec'],
    level: string,
): PinoOutput {
    const fileSpec =
        spec && 'kind' in spec && spec.kind === 'file' ? spec : undefined;

    const destination =
        fileSpec?.destination ??
        cfg?.get<string>('logger.filePath') ??
        DEFAULT_FILE_DESTINATION;

    const multiTransport = createMultiTransport(
        [
            {
                target: 'pino/file',
                level,
                options: { destination },
            },
        ],
        cfg,
    );

    return { mode: 'transport', transport: multiTransport };
}

export function buildConsoleOutput(
    cfg: ConfigService | undefined,
    spec: BuildPinoOutputOptions['spec'],
    level: string,
    isProd: boolean,
): PinoOutput {
    const targets: Array<{
        target: string;
        level?: string;
        options?: Record<string, unknown>;
    }> = [];

    if (!isProd) {
        targets.push({ target: 'pino-pretty', level });
    } else {
        targets.push({
            target: 'pino/file',
            level,
            options: { destination: STDOUT },
        });
    }

    const rawSpec =
        spec && 'kind' in spec && spec.kind === 'raw' ? spec : undefined;
    if (rawSpec?.driverSpecific) {
        targets.push(rawSpec.driverSpecific as (typeof targets)[0]);
    }

    if (targets.length === 0) {
        targets.push({
            target: 'pino/file',
            level,
            options: { destination: STDOUT },
        });
    }

    const multiTransport = createMultiTransport(targets, cfg);
    return { mode: 'transport', transport: multiTransport };
}

import type { BuildPinoOutputOptions, PinoOutput } from './transports/types';
import {
    buildFileRotationOutput,
    buildFileOutput,
    buildConsoleOutput,
} from './transports/builders';
import { normalizeKinds, resolveLevel } from './transports/utils';

export type {
    PinoKind,
    BuildPinoOutputOptions,
    PinoOutput,
    PartialTransportTarget,
} from './transports/types';

export { createMultiTransport } from './transports/core';

export function buildPinoOutput({
    cfg,
    spec,
}: BuildPinoOutputOptions): PinoOutput {
    const isProd = cfg?.get<string>('logger.nodeEnv') === 'production';
    const specKind = spec && 'kind' in spec ? spec.kind : undefined;
    const kinds = normalizeKinds(
        specKind ?? cfg?.get<string>('logger.transports') ?? 'console',
    );
    const specLevel = spec && 'level' in spec ? spec.level : undefined;
    const level = resolveLevel(cfg, specLevel, isProd);

    if (kinds.includes('file-rotation')) {
        return buildFileRotationOutput(cfg, spec);
    }

    if (kinds.includes('file')) {
        return buildFileOutput(cfg, spec, level);
    }

    return buildConsoleOutput(cfg, spec, level, isProd);
}

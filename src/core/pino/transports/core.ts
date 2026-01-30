import type { ConfigService } from '@nestjs/config';
import { transport } from 'pino';
import type pino from 'pino';
import type { PartialTransportTarget } from './types';
import { resolveTargetLevel, resolveTargetOptions } from './utils';

export function createMultiTransport(
    targets: Array<PartialTransportTarget | pino.TransportTargetOptions>,
    cfg?: ConfigService,
): pino.DestinationStream {
    const resolvedTargets: pino.TransportTargetOptions[] = targets.map(
        (target) => {
            const targetName = target.target;
            if (!targetName) {
                throw new Error(
                    'Transport target must have a "target" property',
                );
            }

            return {
                target: targetName,
                level: resolveTargetLevel(targetName, target.level, cfg),
                options: resolveTargetOptions(targetName, target.options, cfg),
            };
        },
    );

    return transport({ targets: resolvedTargets }) as pino.DestinationStream;
}

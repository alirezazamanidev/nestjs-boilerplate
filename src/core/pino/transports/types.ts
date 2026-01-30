import type { ConfigService } from '@nestjs/config';
import type pino from 'pino';
import { CustomTransportSpec } from 'src/core/logger/logger.interface';


export type PinoKind = 'console' | 'file-rotation' | 'file' | 'raw';

export interface BuildPinoOutputOptions {
    cfg?: ConfigService;
    spec?: CustomTransportSpec;
}

export type PinoOutput =
    | { mode: 'stream'; stream: NodeJS.WritableStream }
    | { mode: 'transport'; transport: pino.DestinationStream };

export type PartialTransportTarget = {
    target: string;
    level?: string;
    options?: Record<string, unknown>;
};

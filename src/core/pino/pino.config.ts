import { registerAs } from '@nestjs/config';
import { ManifestConfig } from '../config/config.loader';

export const pinoConfig = registerAs('pino', () => ({
    httpLogging: process.env.HTTP_LOGGING === 'true',
    defaultDebugLevel: 'debug',
    defaultErrorLevel: 'error',
}));

export default new ManifestConfig(pinoConfig);

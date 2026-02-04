import Joi from 'joi';
import { registerAs } from '@nestjs/config';
import { ManifestConfig } from '../config/config.loader';

export const cachingConfig = registerAs('caching', () => ({
    defaultTTL: process.env.CACHING_DEFAULT_TTL
        ? parseInt(process.env.CACHING_DEFAULT_TTL)
        : undefined,
}));

export const cachingConfigSchema = Joi.object({
    CACHING_DEFAULT_TTL: Joi.number().integer().positive(),
});

export default new ManifestConfig(cachingConfig, cachingConfigSchema);

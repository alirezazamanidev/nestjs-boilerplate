import { registerAs } from '@nestjs/config';
import Joi from 'joi';
import { ManifestConfig } from 'src/core/config/config.loader';

export const memoryConfig = registerAs('memory', () => ({
    retryPolicy: {
        maxRetries: process.env.MEMORY_MAX_RETRIES 
            ? parseInt(process.env.MEMORY_MAX_RETRIES, 10) 
            : 3,
        delayTiers: process.env.MEMORY_RETRY_DELAY_TIERS
            ? process.env.MEMORY_RETRY_DELAY_TIERS.split(',').map(d => parseInt(d, 10))
            : [5000, 30000, 300000], // 5s, 30s, 5min
    },
}));

export const memoryConfigSchema= Joi.object({
    MEMORY_MAX_RETRIES: Joi.number().integer().min(0).default(3),
    MEMORY_RETRY_DELAY_TIERS: Joi.string()
        .pattern(/^\d+(,\d+)*$/)
        .default('5000,30000,300000')
        .description('Comma-separated delay tiers in milliseconds (e.g., 5000,30000,300000)'),
});


export default new ManifestConfig(memoryConfig, memoryConfigSchema);

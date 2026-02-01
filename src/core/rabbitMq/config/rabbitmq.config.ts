import { registerAs } from '@nestjs/config';
import Joi from 'joi';
import { parseList } from 'src/common/utils/env.utils';
import { ManifestConfig } from 'src/core/config/config.loader';

const rabbitMqConfig = registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
  username: process.env.RABBITMQ_USERNAME || 'guest',
  password: process.env.RABBITMQ_PASSWORD || 'guest',
  retryPolicy: {
    delayTiers: process.env.RABBITMQ_RETRY_DELAY_TIERS
      ? parseList(process.env.RABBITMQ_RETRY_DELAY_TIERS)
      : [5000, 30000, 300000], // Default tiers: 5s, 30s, 5min
    maxRetries: process.env.RABBITMQ_MAX_RETRIES,
  },
}));
const rabbitmqSchema = Joi.object({
  RABBITMQ_URI: Joi.string().uri().default('amqp://localhost:5672'),
  RABBITMQ_RETRY_DELAY_TIERS: Joi.string()
    .pattern(/^\d+(,\d+)*$/)
    .default('5000,30000,300000')
    .description(
      'Comma-separated delay tiers in milliseconds (e.g., 5000,30000,300000)',
    ),
  RABBITMQ_MAX_RETRIES: Joi.number().integer().min(0).default(3),
});

export default new ManifestConfig(rabbitMqConfig, rabbitmqSchema);
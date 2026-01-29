import { registerAs } from '@nestjs/config';
import Joi from 'joi';
import { ManifestConfig } from '../config/config.loader';

export const loggerConfig = registerAs('logger', () => ({
    driver: process.env.LOG_DRIVER || 'pino',
    level: process.env.LOG_LEVEL || 'info',
    useAppLoggerForNest: process.env.USE_APP_LOGGER_FOR_NEST === 'true',
    useAppLoggerForBootstrap:
        process.env.USE_APP_LOGGER_FOR_BOOTSTRAP === 'true',
    useNestLoggerForCli: process.env.USE_NEST_LOGGER_FOR_CLI === 'true',
    nodeEnv: process.env.NODE_ENV || 'development',
    appName: process.env.APP_NAME,
    appVersion: process.env.APP_VERSION || '1.0.0',
    // Transport settings
    transports: process.env.LOG_TRANSPORTS || 'console',
    filePath: process.env.LOG_FILE_PATH || 'storage/logs/app.log',
    frequency: process.env.LOG_FREQUENCY || 'daily',
    maxLogs: process.env.LOG_MAX_LOGS
        ? parseInt(process.env.LOG_MAX_LOGS, 10)
        : 14,
    dateFormat: process.env.LOG_DATE_FORMAT || 'YYYY-MM-DD',
    auditFilePath: process.env.LOG_AUDIT_FILE_PATH || 'storage/logs/audit.json',
    consoleLogLevel: process.env.CONSOLE_LOG_LEVEL || 'debug',
    fileLogLevel: process.env.FILE_LOG_LEVEL || 'error',
    defaultRotationDestination:
        process.env.LOG_FILE_PATH || 'storage/logs/app-%DATE%.log',
}));

const loggerSchema = Joi.object({
    LOG_DRIVER: Joi.string().valid('pino', 'otel'),
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug'),
    USE_APP_LOGGER_FOR_NEST: Joi.boolean(),
    USE_APP_LOGGER_FOR_BOOTSTRAP: Joi.boolean(),
    USE_NEST_LOGGER_FOR_CLI: Joi.boolean(),
    NODE_ENV: Joi.string().valid('development', 'production'),
    APP_NAME: Joi.string().required(),
    APP_VERSION: Joi.string().required(),
    LOG_TRANSPORTS: Joi.string().valid('console', 'file'),
    LOG_FILE_PATH: Joi.string(),
    LOG_FREQUENCY: Joi.string().valid('daily', 'hourly', 'minutely'),
    LOG_MAX_LOGS: Joi.number().integer().positive(),
    LOG_DATE_FORMAT: Joi.string().valid('YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss'),
    LOG_AUDIT_FILE_PATH: Joi.string(),
    CONSOLE_LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug'),
    FILE_LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug'),
    DEFAULT_ROTATION_DESTINATION: Joi.string(),
});

export default new ManifestConfig(loggerConfig, loggerSchema);

import { Logger as TypeOrmLoggerInterface, QueryRunner } from 'typeorm';
import { AppLogger, BaseBindings } from '../logger/logger.interface';
import { LoggerManager } from '../logger/logger.manager';

export type LogLevelType = 'all' | 'error' | 'warn' | 'info';

export class TypeOrmLogger implements TypeOrmLoggerInterface {
    constructor(private readonly logLevel: LogLevelType = 'all') {}

    private dbLogger(extra?: BaseBindings): AppLogger {
        return LoggerManager.resolveLogger({ context: 'db', ...(extra ?? {}) });
    }

    logQuery(query: string, parameters?: any[], _qr?: QueryRunner) {
        if (this.logLevel === 'all') {
            this.dbLogger().debug({
                eventName: 'db.query',
                body: { msg: 'db_query', query, parameters },
            });
        }
    }

    logQueryError(
        error: string | Error,
        query: string,
        parameters?: any[],
        _qr?: QueryRunner,
    ) {
        this.dbLogger().error({
            eventName: 'db.query.error',
            body: {
                msg: 'db_query_error',
                query,
                parameters,
                error,
            },
        });
    }

    logQuerySlow(
        time: number,
        query: string,
        parameters?: any[],
        _qr?: QueryRunner,
    ) {
        this.dbLogger().warn({
            eventName: 'db.query.slow',
            body: {
                msg: 'db_query_slow',
                timeMs: time,
                query,
                parameters,
            },
        });
    }

    logSchemaBuild(message: string, _qr?: QueryRunner) {
        this.dbLogger().info({
            eventName: 'db.schema.build',
            body: { msg: 'db_schema_build', message },
        });
    }

    logMigration(message: string, _qr?: QueryRunner) {
        this.dbLogger().info({
            eventName: 'db.migration',
            body: { msg: 'db_migration', message },
        });
    }

    log(level: 'log' | 'info' | 'warn', message: any, _qr?: QueryRunner) {
        const l = this.dbLogger();
        if (level === 'warn')
            l.warn({
                eventName: 'db.log',
                body: { msg: 'db_log', message },
            });
        else
            l.info({
                eventName: 'db.log',
                body: { msg: 'db_log', message },
            });
    }
}

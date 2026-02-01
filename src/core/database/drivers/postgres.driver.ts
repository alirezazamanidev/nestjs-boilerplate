import {
  DataSource,
  DataSourceOptions,
  Repository,
  ObjectLiteral,
  DeepPartial,
} from 'typeorm';
import { DatabaseDriver } from '../interfaces';
import { LoggerManager } from 'src/core/logger/logger.manager';
import { TypeOrmLogger } from '../typeorm.logger';
import { NODE_ENV } from 'src/common/config/config';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfigType } from '../database.config';
import { Injectable } from '@nestjs/common';

/**
 * PostgreSQL driver implementing the DatabaseDriver interface.
 * Uses TypeORM for ORM functionality.
 */
@Injectable()
export class PostgresDriver implements DatabaseDriver {
  name = 'postgres';
  private _dataSource: DataSource | null = null;
  private readonly logger = LoggerManager.resolveLogger({
    context: 'PostgresDriver',
  });

  constructor(private readonly configService: ConfigService) {}

  get config() {
    const isDev = NODE_ENV === 'development';
    const isCli = process.env.IS_CLI === 'true';
    const dbConfig = this.configService.get<DatabaseConfigType>('db');
    return {
      type: dbConfig?.type,
      database: dbConfig?.database,
      username: dbConfig?.username,
      password: dbConfig?.password,
      host: dbConfig?.host,
      port: dbConfig?.port,
      synchronize: isDev ? dbConfig?.synchronize : false,
      logging: isCli ? ['error', 'warn'] : dbConfig?.logging,
      logger: isCli
        ? undefined
        : new TypeOrmLogger(dbConfig?.loggingLevel ?? 'all'),
      autoLoadEntities: true,
    } ;
  }
  /**
   * Establishes a connection to the PostgreSQL database.
   */
  async connect(): Promise<void> {
    try {
      this._dataSource = new DataSource(this.config as DataSourceOptions);
      await this._dataSource.initialize();
      this.logger.info({
        eventName: 'PostgresDriver.connect',
        body: {
          message: 'PostgreSQL connected successfully via TypeORM',
        },
      });
    } catch (error) {
      this.logger.error({
        eventName: 'PostgresDriver.connect.error',
        body: {
          message: 'Failed to connect to PostgreSQL',
          error: error instanceof Error ? error.message : error,
        },
      });
      throw error;
    }
  }

  /**
   * Closes the PostgreSQL database connection.
   */
  async disconnect(): Promise<void> {
    if (!this._dataSource?.isInitialized) return;
    await this._dataSource.destroy();
    this.logger.info({
      eventName: 'PostgresDriver.disconnect',
      body: {
        message: 'PostgreSQL disconnected',
      },
    });
    this._dataSource = null;
  }

  /**
   * Inserts a new record into the specified table.
   */
  async create<T extends Record<string, any> = Record<string, any>>(
    table: string,
    data: DeepPartial<T>,
  ): Promise<T> {
    const repo = this.getRepository<ObjectLiteral>(table);
    const entity = repo.create(data as any) as ObjectLiteral;
    return repo.save(entity) as Promise<T>;
  }

  /**
   * Finds all records matching given conditions.
   */
  async find<T extends Record<string, any> = Record<string, any>>(
    table: string,
    conditions: Partial<T> = {},
  ): Promise<T[]> {
    const repo = this.getRepository<T & ObjectLiteral>(table);
    return repo.findBy(conditions as any) as Promise<T[]>;
  }

  /**
   * Finds a single record matching given conditions.
   */
  async findOne<T extends Record<string, any> = Record<string, any>>(
    table: string,
    conditions: Partial<T> = {},
  ): Promise<T | null> {
    const repo = this.getRepository<T & ObjectLiteral>(table);
    return repo.findOneBy(conditions as any) as Promise<T | null>;
  }

  /**
   * Finds a single record by its ID.
   */
  async findById<T extends Record<string, any> = Record<string, any>>(
    table: string,
    id: string | number,
  ): Promise<T | null> {
    const repo = this.getRepository<T & ObjectLiteral>(table);
    return repo.findOneBy({ id } as any) as Promise<T | null>;
  }

  /**
   * Updates records matching given conditions.
   */
  async update<T extends Record<string, any> = Record<string, any>>(
    table: string,
    conditions: Partial<T>,
    data: DeepPartial<T>,
  ): Promise<boolean> {
    const repo = this.getRepository<ObjectLiteral>(table);
    const result = await repo.update(conditions as any, data as any);
    return result.affected != null && result.affected > 0;
  }

  /**
   * Deletes records matching given conditions.
   */
  async delete<T extends Record<string, any> = Record<string, any>>(
    table: string,
    conditions: Partial<T>,
  ): Promise<boolean> {
    const repo = this.getRepository<ObjectLiteral>(table);
    const result = await repo.delete(conditions as any);
    return result.affected != null && result.affected > 0;
  }

  /**
   * Ensures the DataSource is initialized and returns the repository.
   */
  private getRepository<T extends ObjectLiteral>(table: string): Repository<T> {
    if (!this._dataSource?.isInitialized) {
      throw new Error('PostgreSQL connection is not initialized');
    }
    return this._dataSource.getRepository<T>(table);
  }

   get dataSource(): DataSource {
    if (!this._dataSource?.isInitialized) {
      throw new Error('DataSource not initialized');
    }
    return this._dataSource;
  }
}

import { Inject, Logger } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import type { FeatureBundle } from 'src/core/modules/manifest.types';
import { DataSource } from 'typeorm';
import {
  DEFAULT_TRANSACTION_MODE,
  type transactionMode,
} from './migrate.command';
import { createScopedDataSource } from '../migration-scope.utils';
import { SeedCommand } from './seed.command';
type FreshOptions = {
  seed?: boolean;
  transaction?: transactionMode;
  force?: boolean;
  withDefaultGlob?: boolean;
};
@Command({
  name: 'migrate:fresh',
  description: 'Drop ALL tables and re-run ALL migrations',
})
export class MigrateFreshCommand extends CommandRunner {
  private readonly logger = new Logger('MigrateFreshCommand');
  constructor(
    private readonly ds: DataSource,
    @Inject('BUNDLE') private readonly bundle: FeatureBundle,
    private readonly seedCmd:SeedCommand
  ) {
    super();
  }
  async run(passedParams: string[], opts?: FreshOptions) {
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (nodeEnv !== 'development' && !opts?.force) {
      this.logger.error(
        ` Refused in NODE_ENV=${nodeEnv}. Use --force to proceed.`,
      );
      return;
    }
    const scoped = await createScopedDataSource({
      baseDataSource: this.ds,
      withDefaultMigrations: opts?.withDefaultGlob || false,
      onlyModuleId: undefined,
      bundle: this.bundle,
    });
    try {
      await scoped?.initialize();

      const qr = scoped?.createQueryRunner();
      try {
        await qr?.clearDatabase();
      } finally {
        await qr?.release();
      }
      this.logger.log('Database cleared.');
      const ran: any = await scoped?.runMigrations({
        transaction: opts?.transaction ?? DEFAULT_TRANSACTION_MODE,
        fake: false,
      });
      for (const r of ran) this.logger.log(`migrated successfully: ${r.name}`);
      if (ran.length === 0) this.logger.log('No migrations to run.');
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    }finally {
        await scoped?.destroy()
    }
    if(opts?.seed){
        await this.seedCmd.run([],{})
    }
  }
  @Option({ flags: '--seed', description: 'Run seed after fresh migrate' })
  parseSeed(): boolean {
    return true;
  }

  @Option({
    flags: '--transaction <mode>',
    description: 'Transaction mode: all | each | none',
    defaultValue: 'all',
  })
  parseTransaction(v: transactionMode) {
    return v;
  }

  @Option({
    flags: '--force',
    description: 'Confirm running in non-development envs',
  })
  parseForce(): boolean {
    return true;
  }

  @Option({
    flags: '--withDefaultGlob',
    description: 'Include default migrations glob',
    defaultValue: false,
  })
  parseWithDefaultGlob(): boolean {
    return true;
  }
}

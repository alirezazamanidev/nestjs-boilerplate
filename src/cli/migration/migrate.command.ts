import { Inject, Logger } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import type { FeatureBundle } from 'src/core/modules/manifest.types';
import { createScopedDataSource } from '../migration-scope.utils';
import { DataSource, Migration } from 'typeorm';

export type transactionMode = 'all' | 'each' | 'none';
export const DEFAULT_TRANSACTION_MODE: transactionMode = 'none';

type MigrateOptions = {
  only?: string; // module id
  transaction?: transactionMode;
  fake?: boolean;
  withDefaultGlob?: boolean;
};

@Command({
  name: 'migrate',
  description: 'Run pending migrations (optionally per module)',
})
export class MigrateCommand extends CommandRunner {
  private readonly logger = new Logger('MigrateCommand');
  constructor(
    @Inject('BUNDLE') private readonly bundle: FeatureBundle,
    private readonly ds: DataSource,
  ) {
    super();
  }

  async run(inputs: string[], options: MigrateOptions): Promise<void> {
    const scopedDataSource = await createScopedDataSource({
      baseDataSource: this.ds,
      bundle: this.bundle,
      onlyModuleId: options.only,
      withDefaultMigrations: options.withDefaultGlob ?? false,
    });
    this.logger.log(
      `Running migrations for  ${options.only ? `module "${options.only}"` : 'all modules'}`,
    );
    try {
      await scopedDataSource?.initialize();
      const res: any = await scopedDataSource?.runMigrations({
        transaction: options.transaction ?? DEFAULT_TRANSACTION_MODE,
        fake: !!options.fake,
      });
      if (res.length === 0) this.logger.log('No pending migrations.');

      for (const r of res) {
        this.logger.log(`migrated successfully: ${r.name}`);
      }
    } catch (error) {
      this.logger.error(error);
      throw error;
    } finally {
      await scopedDataSource?.destroy();
    }
        this.logger.log('Migrations completed');

  }
  @Option({
    flags: '-o, --only <moduleId>',
    description: 'Run only migrations of a specific module',
  })
  parseOnly(v: string) {
    return v;
  }
  @Option({
    flags: '--transaction <mode>',
    description: 'Transaction mode: all | each | none',
    defaultValue: DEFAULT_TRANSACTION_MODE,
  })
  parseTransaction(v: transactionMode) {
    return v;
  }

  @Option({
    flags: '--fake',
    description: 'Mark as executed without running SQL',
  })
  parseFake(): boolean {
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

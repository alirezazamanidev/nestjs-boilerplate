import { Command, CommandRunner, Option } from 'nest-commander';
import {
  DEFAULT_TRANSACTION_MODE,
  type transactionMode,
} from './migrate.command';
import { Inject, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { FeatureBundle } from 'src/core/modules/manifest.types';
import { createScopedDataSource } from '../migration-scope.utils';

type RollbackOptions = {
  steps?: number;
  transaction?: transactionMode;
};
@Command({
  name: 'migrate:rollback',
  description: 'Revert last migration(s) (optionally per module)',
})
export class MigrateRollbackCommand extends CommandRunner {
  private readonly logger: Logger;
  constructor(
    private readonly ds: DataSource,
    @Inject('BUNDLE') private readonly bundle: FeatureBundle,
  ) {
    super();
  }
  async run(inputs: string[], options?: RollbackOptions): Promise<void> {
    const scoped = await createScopedDataSource({
      baseDataSource: this.ds,
      bundle: this.bundle,
      withDefaultMigrations: true,
    });

    try {
      await scoped?.initialize();

      const result = await scoped?.query(
        `SELECT COUNT(*) AS c FROM \`migrations\``,
      );
      const [{ c }] = result;

      if (!c || Number(c) === 0) {
        this.logger.log('Nothing to rollback (migrations table is empty).');
        return;
      }
      const requested = Math.max(1, options?.steps ?? 1);
      const maxPossible = Number(c);
      const steps = Math.min(requested, maxPossible);

      if (requested > steps) {
        this.logger.warn(
          `Requested steps (${requested}) > available (${maxPossible}). ` +
            `Capped to ${steps}.`,
        );
      }

      const toRevert = await scoped?.query(
        `SELECT name FROM \`migrations\` ORDER BY timestamp DESC LIMIT ?`,
        [steps],
      );

      for (let i = 0; i < steps; i++) {
        const migration = toRevert[i];
        const name = migration?.name;
        this.logger.warn(`WILL_CALL_UNDO ${name ? `(${name})` : ''}`);

        await scoped?.undoLastMigration({
          transaction: options?.transaction ?? DEFAULT_TRANSACTION_MODE,
        });

        this.logger.log(`reverted: ${name ?? `#${i + 1}`} (${i + 1}/${steps})`);
      }
    } catch (error) {
         this.logger.error(error);
            throw error;
    }finally {
        await scoped?.destroy()
    }
  }

  @Option({
    flags: '-o, --only <moduleId>',
    description: 'Rollback only for a specific module',
  })
  parseOnly(v: string) {
    return v;
  }

  @Option({
    flags: '--steps <n>',
    description: 'Number of steps to rollback (default: 1)',
    defaultValue: 1,
  })
  parseSteps(v: string) {
    return parseInt(v, 10);
  }

  @Option({
    flags: '--transaction <mode>',
    description: 'Transaction mode: all | each | none',
    defaultValue: DEFAULT_TRANSACTION_MODE,
  })
  parseTransaction(v: transactionMode) {
    return v;
  }
}

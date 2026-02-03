import { Command, CommandRunner, Option } from 'nest-commander';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import type { FeatureBundle } from 'src/core/modules/manifest.types';
import { createScopedDataSource } from '../migration-scope.utils';

type StatusOptions = {
  only?: string;
};

@Injectable()
@Command({
  name: 'migrate:status',
  description: 'Show migration status (optionally per module)',
})
export class MigrateStatusCommand extends CommandRunner {
  private readonly logger: Logger = new Logger('MigrateStatusCommand');
  constructor(
    private readonly ds: DataSource,
    @Inject('BUNDLE') private readonly bundle: FeatureBundle,
  ) {
    super();
    this.logger = new Logger('MigrateStatusCommand');
  }

  @Option({
    flags: '-o, --only <moduleId>',
    description: 'Show status only for a specific module',
  })
  parseOnly(v: string) {
    return v;
  }

  async run(_inputs: string[], opts: StatusOptions): Promise<void> {
    const scoped = await createScopedDataSource({
      baseDataSource: this.ds,
      bundle: this.bundle,
      onlyModuleId: opts.only,
      withDefaultMigrations: !opts.only,
    });
    try {
      await scoped?.initialize();
      const hasPending = await scoped?.showMigrations();
      if (hasPending) {
        this.logger.warn('Pending migrations exist.');
      } else {
        this.logger.warn('No pending migrations.');
      }
    } finally {
      await scoped?.destroy();
    }
  }
}

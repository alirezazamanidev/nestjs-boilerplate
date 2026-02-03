import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { Command, CommandRunner, Option } from 'nest-commander';
import { join, resolve } from 'path';
import { cwd } from 'process';
import { activeOrderedManifests } from 'src/core/modules/manifest.loader';
import type {
  FeatureBundle,
  LoadManifestsOptions,
} from 'src/core/modules/manifest.types';
import { DataSource } from 'typeorm';
const CLI_PATH = join(
  process.cwd(),
  'dist',
  'core',
  'database',
  'datasource.cli.js',
);

type GenerateOptions = {
  name: string;
  module?: string; // just usable for create type
  type?: 'create' | 'generate';
};

@Command({
  name: 'migrate:make',
  description: 'generate migration',
})
export class MigrateMakeCommand extends CommandRunner {
  private readonly logger = new Logger('MigrateMakeCommand');

  constructor(
    private readonly ds: DataSource,
    private readonly config: ConfigService,
    @Inject('BUNDLE') private readonly bundle: FeatureBundle,
  ) {
    super();
  }
  async run(inputs: string[], options?: GenerateOptions): Promise<void> {
    try {
      if (!options?.name) {
        this.logger.error(
          'Migration name is required. Use --name <migrationName>',
        );
        return;
      }
      const outDir = await this.resolveOutputDir(options?.module);
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
      const migrationPath =
        options.type === 'generate'
          ? resolve(cwd(), outDir, options.name)
          : join(outDir, options.name);

      const command =
        options.type === 'generate'
          ? [
              'typeorm',
              
              'migration:generate',
              '-d',
              CLI_PATH,
              migrationPath,
            ]
          : ['typeorm', 'migration:create', migrationPath];
      this.logger.log('Running:', command.join(' '));

      const result = spawnSync('npx', command, {
        stdio: 'inherit',
        cwd: cwd(),
        shell: false,
      });
      if (result.status === 0) {
        this.logger.log('Migration created successfully.');
      } else {
        this.logger.warn('No migration created.');
      }
    } catch (error) {
      this.logger.error(error, 'Migration creation failed.');
      throw error;
    }
  }

  private async resolveOutputDir(moduleId?: string): Promise<string> {
    if (!moduleId) return 'src/database/migrations';
    const manifestOptions: LoadManifestsOptions = {
      forceReload: process.env.FORCE_RELOAD_MANIFESTS === 'true',
    };
    const manifests = await activeOrderedManifests(manifestOptions);
    const m = manifests.find((x) => x.id === moduleId);
    if (!m) throw new Error(`Module '${moduleId}' not found or inactive.`);
    return (
      m.db?.migrations?.[0]
        ?.replace(/^dist\//, 'src/')
        ?.replace(/\/[^/]+$/, '') ??
      `src/modules/${moduleId}/database/migrations`
    );
  }

  @Option({
    flags: '-n, --name <migrationName>',
    description: 'Name of migration (required)',
  })
  parseName(v: string) {
    return v;
  }

  @Option({
    flags: '-m, --module <moduleId>',
    description: 'Module ID to place migration in (optional)',
  })
  parseModule(v: string) {
    return v;
  }
  @Option({
    flags: '-t, --type <create|generate>',
    description: 'Use "create" (empty file) or "generate" (diff entities)',
    defaultValue: 'create',
  })
  parseType(v: 'create' | 'generate') {
    return v;
  }
}

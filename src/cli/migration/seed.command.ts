import { en, fa, Faker } from '@faker-js/faker';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FastGlob from 'fast-glob';
import { Command, CommandRunner, Option } from 'nest-commander';
import { activeOrderedManifests } from 'src/core/modules/manifest.loader';
import type {
  FakeContext,
  FeatureBundle,
  LoadManifestsOptions,
  SeedFn,
} from 'src/core/modules/manifest.types';
import { DataSource } from 'typeorm';
import { pathToFileURL } from 'url';

type SeedOptions = {
  only?: string;
};
@Command({
  name: 'seed',
  description: 'Run seeds for active modules',
})
export class SeedCommand extends CommandRunner {
  private faker?: Faker;
  private readonly logger = new Logger('SeedCommand');
  constructor(
    private readonly ds: DataSource,
    private readonly config: ConfigService,
    @Inject('BUNDLE') private readonly bundle: FeatureBundle,
  ) {
    super();
  }
  @Option({
    flags: '-o, --only <moduleId>',
    description: 'Just one module id',
  })
  parseOnly(v: string) {
    return v;
  }

  async run(passedParams: string[], options: SeedOptions): Promise<void> {
    try {
      this.setupFaker();
      const ctx: FakeContext = this.setupContext();
      if (options.only) {
        const manifestOptions: LoadManifestsOptions = {
          forceReload: process.env.FORCE_RELOAD_MANIFESTS === 'true',
        };
        const manifests = await activeOrderedManifests(manifestOptions);
        const mod = manifests.find((m) => m.id === options.only);
        if (!mod) {
          this.logger.error(
            `Module "${options.only}" is not active or not found`,
          );
          return;
        }
        if (!mod.db?.seeders?.length) {
          this.logger.warn(`No seeders declared for module "${options.only}"`);
          return;
        }
        await this.execSeeds(mod.db.seeders, ctx);
      } else {
        await this.execSeeds(this.bundle.db.seeders ?? [], ctx);
      }

      this.logger.log('Seeding done');
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
  private async execSeeds(globs: string[], ctx: FakeContext) {
    const files = await FastGlob(globs, { absolute: true });
    for (const file of files) {
      const mod = await import(pathToFileURL(file).href).catch(
        async () => await import(file),
      );
      const seed: SeedFn = mod.default?.seed;
      if (typeof seed === 'function') {
        await seed(ctx);
      }
    }
  }
  private setupContext(): FakeContext {
    return {
      app: (this as any).app,
      dataSource: this.ds,
      faker: this.faker,
      cfg: (k) => this.config?.get(k),
      em: this.ds.manager,
    };
  }

  private setupFaker() {
    const faker = new Faker({ locale: [fa, en] });
    faker.seed(42);
    this.faker = faker;
  }
}

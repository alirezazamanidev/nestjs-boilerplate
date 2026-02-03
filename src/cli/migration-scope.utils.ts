import { activeOrderedManifests } from 'src/core/modules/manifest.loader';
import {
  FeatureBundle,
  LoadManifestsOptions,
} from 'src/core/modules/manifest.types';
import { DataSource } from 'typeorm';
export const DEFAULT_MIGRATIONS_GLOB = 'dist/database/migrations/*.js';

interface Options {
  baseDataSource: DataSource;
  bundle: FeatureBundle;
  onlyModuleId?: string;
  withDefaultMigrations?: boolean;
}
export const createScopedDataSource = async (
  {bundle,onlyModuleId,withDefaultMigrations=true,baseDataSource}: Options,
)=> {
  let migrationsGlobs: string[];
  let entitiesGlobs: string[];
  if (onlyModuleId) {
    const manifestOptions: LoadManifestsOptions = {
      forceReload: process.env.FORCE_RELOAD_MANIFESTS === 'true',
    };
    const manifests = await activeOrderedManifests(manifestOptions);
    const moduleManifest = manifests.find((m) => m.id === onlyModuleId);
    migrationsGlobs = moduleManifest?.db?.migrations ?? [];
    entitiesGlobs = moduleManifest?.db?.entities || [];

    if (migrationsGlobs.length === 0) {
      console.warn(`No migrations found for module "${onlyModuleId}".`);
    } else {
      migrationsGlobs = bundle.db.migrations;
      entitiesGlobs = bundle.db.entities;
    }

    const baseOptions = baseDataSource.options;
      return new DataSource({
        ...baseOptions,
        entities: entitiesGlobs,
        migrations: withDefaultMigrations
            ? [DEFAULT_MIGRATIONS_GLOB, ...migrationsGlobs]
            : migrationsGlobs,
    });
  }
};

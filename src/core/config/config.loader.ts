import { join } from 'path';
import { LoadConfigOptions, ManifestConfig } from './config.types';
import { existsSync } from 'fs';
import fg from 'fast-glob';
import { importModule } from 'src/common/utils/module.utils';
import { ConfigFactory } from '@nestjs/config';

import { getActiveManifests } from '../modules/manifest.loader';
import Joi from 'joi';
function isManifestConfig(x: unknown): x is ManifestConfig {
  if (!x || typeof x !== 'object') return false;

  const anyX = x as any;
  const okfactory =
    anyX.factory === undefined || typeof anyX.factory === 'function';
  const okSchema =
    anyX.schema === undefined ||
    (typeof anyX.schema === 'object' &&
      anyX.schema !== null &&
      typeof anyX.schema.concat === 'function');

  return okfactory && okSchema;
}

function defualtCoreConfigGlob(cwd = process.cwd()): string {
  const distDir = join(cwd, 'dist');

  return existsSync(distDir)
    ? join(cwd, 'dist/core/**/*.config.js')
    : join(cwd, 'src/core/**/*.config.ts');
}
function pickExport(mod: any): unknown {
  return (
    mod?.default?.default ?? mod?.default ?? mod?.config ?? mod?.manifestConfig
  );
}

let CORE_MODULES: ManifestConfig[] = [];

export async function loadCoreModulesConfig(
  opts: LoadConfigOptions,
): Promise<ManifestConfig[]> {
  if (!opts.forceReload && CORE_MODULES.length > 0) return CORE_MODULES;
  if (opts.forceReload) CORE_MODULES = [];
  const cwd = opts.cwd ?? process.cwd();
  const pattenn = opts.coreGlob ?? defualtCoreConfigGlob(cwd);
  const files = await fg(pattenn, { absolute: opts.absolute ?? true, cwd });
  const configs = await Promise.all(
    files.map(async (file) => {
      const mod = await importModule<any>(file);
      const exported = pickExport(mod);
      return isManifestConfig(exported) ? exported : undefined;
    }),
  );

  CORE_MODULES = configs.filter(Boolean) as ManifestConfig[];
  return CORE_MODULES;
}

export async function getConfigFactories(
  opts: LoadConfigOptions = {},
): Promise<ConfigFactory[]> {
  const coreConfigs = await loadCoreModulesConfig(opts);
  const activeManifests = await getActiveManifests(opts.manifests);
  const featureFactories = activeManifests
    .map((m) => m.config?.factory)
    .filter((x): x is ConfigFactory => typeof x === 'function');
  const coreFactories = coreConfigs
  .map((c) => c.factory).filter((x): x is ConfigFactory => typeof x === 'function');


  return [...coreFactories, ...featureFactories];
}
export async function getConfigSchemas(
    opts: LoadConfigOptions = {},
): Promise<Joi.ObjectSchema[]> {
    const coreConfigs = await loadCoreModulesConfig(opts);

    const activeManifests = await getActiveManifests(opts.manifests);
    const featureSchemas = activeManifests
        .map((m) => m.config?.schema)
        .filter((x): x is Joi.ObjectSchema => !!x);

    const coreSchemas = coreConfigs
        .map((c) => c.schema)
        .filter((x): x is Joi.ObjectSchema => !!x);

    return [...coreSchemas, ...featureSchemas];
}
export async function getEnvSchema(
    opts: LoadConfigOptions = {},
): Promise<Joi.ObjectSchema> {
    const schemas = await getConfigSchemas(opts);
    return schemas.reduce((acc, s) => acc.concat(s), Joi.object({}));
}

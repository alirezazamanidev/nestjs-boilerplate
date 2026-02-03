import { ModuleManifest } from 'src/core/modules/manifest.types';
import { UserConfig } from './config/user.config.js';
import { UserSchema } from './config/user.config.schema.js';

export const manifest: ModuleManifest = {
  id: 'user',
  title: 'user',
  priority: 10,
  enabledByDefault: true,
  getModule: async () => (await import('./user.module.js')).UserModule,
  config: {
    factory: UserConfig,
    schema: UserSchema,
  },
  db: {
    entities: ['dist/modules/user/database/entities/*.entity.js'],
    migrations: ['dist/modules/user/database/migrations/*.js'],
    seeders: ['dist/modules/user/database/seeders/*.js'],
    factories: ['dist/modules/user/database/factories/*.js'],
  },
  tags: ['user'],
};

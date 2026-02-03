import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { parseList } from 'src/common/utils/env.utils';

type PersistedManifest = {
    id: string;
    priority?: number;
    db?: {
        entities?: string[];
        migrations?: string[];
        seeders?: string[];
        factories?: string[];
    };
};
type PersistedBundle = {
    generatedAt: string;
    manifests: PersistedManifest[];
};

const bundlePath = join(process.cwd(), ...parseList(process.env.BUNDLE_PATH));
let bundle: PersistedBundle | null = null;

try {
    const raw = readFileSync(bundlePath, 'utf8');
    bundle = JSON.parse(raw) as PersistedBundle;
} catch (e) {
    throw new Error(
        `bundle.json not found or unreadable at ${bundlePath}. ` +
            `Run: npm run bundle:build (after build)`,
    );
}

let manifests = bundle?.manifests ?? [];

const list = (v?: string) =>
    (v ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
const enabled = list(process.env.MODULES_ENABLED);
const disabled = list(process.env.MODULES_DISABLED);

if (enabled.length) {
    manifests = manifests.filter((m) => enabled.includes(m.id));
} else if (disabled.length) {
    manifests = manifests.filter((m) => !disabled.includes(m.id));
}

const entities = manifests.flatMap((m) => m.db?.entities ?? []);
const migrations = manifests.flatMap((m) => m.db?.migrations ?? []);

const ds = new DataSource({
    type: process.env.DB_TYPE as any,
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
    entities,
    migrations,
    synchronize: false,
    migrationsRun: false,
    dropSchema: false,
    logging: ['schema', 'error'],
});

export default ds;

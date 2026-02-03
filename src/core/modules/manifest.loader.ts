import { join } from "path";
import { FeatureBundle, ImportedModule, LoadManifestsOptions, ModuleDbPaths, ModuleManifest } from "./manifest.types";
import { existsSync } from "fs";
import fg from "fast-glob";
import { importModule } from "src/common/utils/module.utils";
import { parseList } from "src/common/utils/env.utils";
import { Type } from "@nestjs/common";
import { ConfigFactory } from "@nestjs/config";

export const MANIFESTS: ModuleManifest[] = [];
function defaultManifestGlob(cwd = process.cwd()): string {
    const distDir = join(cwd, 'dist');
    return existsSync(distDir)
        ? join(cwd, 'dist/modules/**/*.manifest.js')
        : join(cwd, 'src/modules/**/*.manifest.ts');
}
function isValidManifest(manifest: unknown): manifest is ModuleManifest {
    return (
        typeof manifest === 'object' &&
        manifest !== null &&
        typeof (manifest as any).id === 'string' &&
        typeof (manifest as any).getModule === 'function'
    );
}
function extractManifest(module: ImportedModule): ModuleManifest | null {
    const manifest = module.default?.manifest ?? module.manifest;
    return isValidManifest(manifest) ? manifest : null;
}
export function resetManifests(): void {
    MANIFESTS.length = 0;
}

export async function loadManifests(
    opts: LoadManifestsOptions = {},
): Promise<ModuleManifest[]> {
    if (!opts.forceReload && MANIFESTS.length > 0) return MANIFESTS;
    if (opts.forceReload) resetManifests();

    const cwd = opts.cwd ?? process.cwd();
    const pattern = opts.glob ?? defaultManifestGlob(cwd);

    const files = await fg(pattern, { absolute: opts.absolute ?? true, cwd });

    const manifests = await Promise.all(
        files.map(async (file) => {
            const mod = await importModule<ImportedModule>(file);
            const manifest = extractManifest(mod);
            if (!manifest) throw new Error(`Invalid manifest shape in ${file}`);
            return manifest;
        }),
    );

    MANIFESTS.push(...manifests);
    return MANIFESTS;
}
export async function reloadManifests(
    opts: Omit<LoadManifestsOptions, 'forceReload'> = {},
) {
    return loadManifests({ ...opts, forceReload: true });
}


export function filterActive(manifests: ModuleManifest[]):ModuleManifest[] {
    const enabled=parseList(process.env.ENABLED_MODULES);
    const disabled=parseList(process.env.MODULES_DISABLED);
    
    return manifests.filter((m) => {
        if (enabled.length > 0) return enabled.includes(m.id);
        if (disabled.length > 0) return !disabled.includes(m.id);
        return m.enabledByDefault !== false;
    });
}
export function sortByPriority(manifests: ModuleManifest[]): ModuleManifest[] {
    return [...manifests].sort((a, b) => {
        const pa = a.priority ?? 100;
        const pb = b.priority ?? 100;
        if (pa !== pb) return pa - pb;
        return a.id.localeCompare(b.id);
    });
}

export async function getActiveManifests(opts?: LoadManifestsOptions) {
    return filterActive(await loadManifests(opts));
}
export async function activeOrderedManifests(
    opts: LoadManifestsOptions = {},
): Promise<ModuleManifest[]> {
    const manifests = await loadManifests(opts);
    return sortByPriority(filterActive(manifests));
}

function extractDbPaths(
    manifests: ModuleManifest[],
    key: keyof ModuleDbPaths,
): string[] {
    return manifests.flatMap((m) => m.db?.[key] ?? []);
}

export async function buildBundle(
    manifests: ModuleManifest[],
): Promise<FeatureBundle> {
    const ordered = sortByPriority(manifests);

    const modules: Type<any>[] = [];
    const configs: ConfigFactory[] = [];

    for (const m of ordered) {
        modules.push(await m.getModule());
        if (m.config?.factory) configs.push(m.config.factory);
    }

    return {
        modules,
        configs,
        manifests: ordered,
        db: {
            entities: extractDbPaths(ordered, 'entities'),
            migrations: extractDbPaths(ordered, 'migrations'),
            seeders: extractDbPaths(ordered, 'seeders'),
            factories: extractDbPaths(ordered, 'factories'),
        },
        report: ordered.map((m) => ({
            id: m.id,
            title: m.title,
            tags: m.tags,
        })),
    };
}

export async function buildActiveBundle(
    opts: LoadManifestsOptions = {},
): Promise<FeatureBundle> {
    const manifests = await loadManifests(opts);
    return buildBundle(filterActive(manifests));
}

import { Type } from "@nestjs/common";
import { ManifestConfigType } from "../config/config.types";
import { ConfigFactory } from "@nestjs/config";

export type LoadManifestsOptions = {
    glob?: string;
    cwd?: string;
    absolute?: boolean; // default: true
    forceReload?: boolean; // default: false
};
export interface ModuleDbPaths {
    entities?: string[]; // glob patterns (JS in dist)
    migrations?: string[];
    seeders?: string[];
    factories?: string[];
}
export interface ImportedModule {
    default?: { manifest?: ModuleManifest };
    manifest?: ModuleManifest;
}
export interface ModuleManifest {
    id: string;
    title?: string;
    priority?: number;
    enabledByDefault?: boolean;
    getModule: () => Promise<Type<any>>;
    config?: ManifestConfigType;
    db?: ModuleDbPaths;
    tags?: string[];
}

export interface ModuleDbPaths {
    entities?: string[]; // glob patterns (JS in dist)
    migrations?: string[];
    seeders?: string[];
    factories?: string[];
}

export type FeatureBundle = {
    modules: Type<any>[];
    configs: ConfigFactory[];
    db: {
        entities: string[];
        migrations: string[];
        seeders: string[];
        factories: string[];
    };
    report: Array<{ id: string; title?: string; tags?: string[] }>;
    manifests: ModuleManifest[]; // active+ordered
};

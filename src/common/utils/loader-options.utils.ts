import { LoadConfigOptions } from "src/core/config/config.types";
import { LoadManifestsOptions } from "src/core/modules/manifest.types";


function getEnvString(key: string): string | undefined {
    const value = process.env[key]?.trim();
    return value && value !== '' ? value : undefined;
}

function getEnvBoolean(key: string): boolean | undefined {
    const value = process.env[key]?.trim();
    if (!value || value === '') return undefined;
    return value === 'true';
}

export function getManifestsOptionsFromEnv(): LoadManifestsOptions {
    return {
        glob: getEnvString('MANIFESTS_GLOB'),
        cwd: getEnvString('MANIFESTS_CWD'),
        absolute: getEnvBoolean('MANIFESTS_ABSOLUTE'),
        forceReload: getEnvBoolean('MANIFESTS_FORCE_RELOAD'),
    };
}

export function getConfigOptionsFromEnv(): LoadConfigOptions{
    return {
        coreGlob: getEnvString('CONFIG_CORE_GLOB'),
        cwd: getEnvString('CONFIG_CWD'),
        absolute: getEnvBoolean('CONFIG_ABSOLUTE'),
        forceReload: getEnvBoolean('CONFIG_FORCE_RELOAD'),
        manifests: getManifestsOptionsFromEnv(),
    };
}

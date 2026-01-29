import fs from 'node:fs';
import path from 'node:path';
import { Setup } from './setup.base';
import { shouldExcludeFile } from 'src/common/utils/file.utils';
import { importModule } from 'src/common/utils/module.utils';
import { createClassInstance } from 'src/common/utils/class.utils';

const DEFAULT_ORDER = 100;

function resolveSetupDirectory(baseDir: string): string | null {
    if (fs.existsSync(baseDir)) {
        return baseDir;
    }

    const srcDirectory = path.join(
        process.cwd(),
        'src',
        'core',
        'bootstrap',
        'setups',
    );
    if (fs.existsSync(srcDirectory)) {
        return srcDirectory;
    }

    return null;
}

function filterSetupFiles(files: string[]): string[] {
    return files.filter((file) => !shouldExcludeFile(file));
}

export async function loadSetupInstances(
    baseDir = path.join(process.cwd(), 'dist', 'core', 'bootstrap', 'setups'),
): Promise<Setup[]> {
    const directory = resolveSetupDirectory(baseDir);
    if (!directory) {
        return [];
    }

    const allFiles = fs.readdirSync(directory);
    const setupFiles = filterSetupFiles(allFiles);
    const instances: Setup[] = [];

    const instancePromises = setupFiles.map(async (filename) => {
        const filePath = path.join(directory, filename);
        try {
            const module = await importModule<unknown>(filePath);
            const instance = createClassInstance(module, Setup);
            return instance;
        } catch (error) {
            console.error(`Failed to load setup from ${filePath}:`, error);
            throw error;
        }
    });

    const results = await Promise.all(instancePromises);
    const validInstances = results.filter(
        (instance): instance is Setup =>
            instance !== null && instance !== undefined,
    );
    instances.push(...validInstances);

    instances.sort(
        (a, b) => (a.order ?? DEFAULT_ORDER) - (b.order ?? DEFAULT_ORDER),
    );
    return instances;
}

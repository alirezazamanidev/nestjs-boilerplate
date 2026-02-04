import * as fs from 'node:fs';
import * as path from 'node:path';

type ConflictMode = 'keep-first' | 'overwrite' | 'warn' | 'error';

type EnsureOptions = {
    projectRoot?: string;
    srcDir?: string; // default: "src"
    outDir?: string; // default: "storage/i18n/translations"
    languages?: string[]; // default: ["en","fa"]
    conflict?: ConflictMode; // default: "keep-first"
    force?: boolean; // if true: rebuild even if output exists
};

export function ensureTranslationsFlattened(opts: EnsureOptions = {}): void {
    const projectRoot = opts.projectRoot ?? process.cwd();
    const srcDir = opts.srcDir ?? process.env.I18N_SRC_DIR ?? 'src';
    const outDir =
        opts.outDir ??
        process.env.I18N_OUT_DIR ??
        path.join('storage', 'i18n', 'translations');
    const languages =
        opts.languages ??
        (process.env.I18N_LANGS
            ? process.env.I18N_LANGS.split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
            : ['en', 'fa']);

    const conflict = (opts.conflict ??
        (process.env.I18N_CONFLICT as ConflictMode) ??
        'keep-first') as ConflictMode;
    const force = opts.force ?? false;

    const absSrc = path.join(projectRoot, srcDir);
    const absOut = path.join(projectRoot, outDir);

    // If output exists and looks valid, skip (unless force)
    if (!force && looksFlattened(absOut, languages)) return;

    rebuild({ projectRoot, absSrc, absOut, languages, conflict });
}

function looksFlattened(outDirAbs: string, languages: string[]): boolean {
    if (!fs.existsSync(outDirAbs)) return false;
    try {
        const entries = fs.readdirSync(outDirAbs, { withFileTypes: true });
        const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
        if (dirs.length === 0) return false;
        return dirs.every((d) => languages.includes(d));
    } catch {
        return false;
    }
}

function rebuild(params: {
    projectRoot: string;
    absSrc: string;
    absOut: string;
    languages: string[];
    conflict: ConflictMode;
}): void {
    const { projectRoot, absSrc, absOut, languages, conflict } = params;

    rm(absOut);
    for (const lang of languages) mkdir(path.join(absOut, lang));

    const sources = collectSources(absSrc);
    if (sources.length === 0) {
        console.warn(
            `⚠️  No translation sources found under ${path.relative(projectRoot, absSrc)}`,
        );
        return;
    }

    const copiedFiles = new Map<string, string>(); // targetPath -> sourceNa me
    let copiedCount = 0;

    for (const src of sources) {
        for (const lang of languages) {
            const langDir = path.join(src.dir, lang);
            if (!fs.existsSync(langDir)) continue;

            const files = fs
                .readdirSync(langDir)
                .filter((f) => f.endsWith('.json'));
            for (const file of files) {
                const sourcePath = path.join(langDir, file);
                const targetPath = path.join(absOut, lang, file);

                if (copiedFiles.has(targetPath)) {
                    const existing = copiedFiles.get(targetPath)!;
                    const msg = `Translation conflict for ${path.relative(projectRoot, targetPath)}: ${existing} vs ${src.name}`;

                    if (conflict === 'error') throw new Error(msg);
                    if (conflict === 'warn') console.warn(`⚠️  ${msg}`);
                    if (conflict === 'overwrite') {
                        fs.copyFileSync(sourcePath, targetPath);
                        copiedFiles.set(targetPath, src.name);
                        continue;
                    }
                    // keep-first
                    continue;
                }

                fs.copyFileSync(sourcePath, targetPath);
                copiedFiles.set(targetPath, src.name);
                copiedCount++;
            }
        }
    }

    if (copiedCount === 0) {
        console.warn('⚠️  No translation JSON files found.');
        return;
    }

    console.log(`✅ Flattened ${copiedCount} translation files`);
    console.log(`📁 Output: ${path.relative(projectRoot, absOut)}`);
}

function collectSources(absSrc: string): Array<{ name: string; dir: string }> {
    const sources: Array<{ name: string; dir: string }> = [];

    const core = path.join(absSrc, 'core', 'i18n', 'translations');
    if (fs.existsSync(core)) sources.push({ name: 'core', dir: core });

    const common = path.join(absSrc, 'common', 'translations');
    if (fs.existsSync(common)) sources.push({ name: 'common', dir: common });

    const modulesRoot = path.join(absSrc, 'modules');
    if (fs.existsSync(modulesRoot)) {
        const modules = fs
            .readdirSync(modulesRoot, { withFileTypes: true })
            .filter((d) => d.isDirectory());
        for (const m of modules) {
            const mDir = path.join(modulesRoot, m.name, 'translations');
            if (fs.existsSync(mDir)) sources.push({ name: m.name, dir: mDir });
        }
    }

    return sources;
}

function rm(dir: string) {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}
function mkdir(dir: string) {
    fs.mkdirSync(dir, { recursive: true });
}

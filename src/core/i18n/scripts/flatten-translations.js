#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const SRC_DIR = process.env.I18N_SRC_DIR || 'src';
const OUT_DIR =
    process.env.I18N_OUT_DIR || path.join('storage', 'i18n', 'translations');
const LANGS = (process.env.I18N_LANGS || 'en,fa')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const CONFLICT = (process.env.I18N_CONFLICT || 'keep-first').toLowerCase(); // warn|error|keep-first|overwrite

const absSrc = path.join(projectRoot, SRC_DIR);
const absOut = path.join(projectRoot, OUT_DIR);

function rm(dir) {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function mkdir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function listJsonFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
}

function collectSources() {
    const sources = [];

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

function handleConflict({ targetPath, sourcePath, existingSource }) {
    const msg = `Translation conflict for ${path.relative(projectRoot, targetPath)}: ${existingSource} vs ${sourcePath}`;

    if (CONFLICT === 'error') throw new Error(msg);
    if (CONFLICT === 'warn') console.warn(`⚠️  ${msg}`);
    if (CONFLICT === 'overwrite') return 'overwrite';
    // keep-first default
    return 'keep-first';
}

function main() {
    // clean output
    rm(absOut);
    for (const lang of LANGS) mkdir(path.join(absOut, lang));

    const sources = collectSources();
    if (sources.length === 0) {
        console.warn(
            `⚠️  No translation sources found under ${path.relative(projectRoot, absSrc)}`,
        );
        return;
    }

    const copiedFiles = new Map(); // targetPath -> sourceName
    let copiedCount = 0;

    for (const src of sources) {
        for (const lang of LANGS) {
            const langDir = path.join(src.dir, lang);
            if (!fs.existsSync(langDir)) continue;

            for (const file of listJsonFiles(langDir)) {
                const sourcePath = path.join(langDir, file);
                const targetPath = path.join(absOut, lang, file);

                if (copiedFiles.has(targetPath)) {
                    const decision = handleConflict({
                        targetPath,
                        sourcePath,
                        existingSource: copiedFiles.get(targetPath),
                    });
                    if (decision === 'overwrite') {
                        fs.copyFileSync(sourcePath, targetPath);
                        copiedFiles.set(targetPath, src.name);
                        continue;
                    }
                    // keep-first / warn
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

main();

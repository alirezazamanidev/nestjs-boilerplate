import { Command, CommandRunner } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { join, dirname } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { filterActive, loadManifests, sortByPriority } from 'src/core/modules/manifest.loader';
import { parseList } from 'src/common/utils/env.utils';

@Command({
  name: 'bundle:build',
  description: 'Build bundle snapshot from manifests',
})
export class BundleBuildCommand extends CommandRunner {
  private readonly logger = new Logger('BundleBuilder');

  async run(): Promise<void> {
    try {
      const manifests = await loadManifests();
      const active = filterActive(manifests);
      const ordered = sortByPriority(active);

      const snapshot = {
        generatedAt: new Date().toISOString(),
        manifests: ordered.map((m) => ({
          id: m.id,
          title: m.title,
          priority: m.priority ?? 100,
          enabledByDefault: m.enabledByDefault ?? true,
          db: m.db ?? {},
        })),
      };

      const outPath = join(
        process.cwd(),
        ...parseList(process.env.BUNDLE_PATH || 'dist/bundle.snapshot.json'),
      );
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, JSON.stringify(snapshot, null, 2), 'utf8');

      this.logger.log(`Bundle snapshot written to: ${outPath}`);
    } catch (err) {
      this.logger.error('Failed to build bundle snapshot:', err);
      process.exit(1);
    }
  }
}
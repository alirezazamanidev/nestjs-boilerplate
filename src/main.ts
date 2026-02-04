
import { ConfigService } from '@nestjs/config';
import { getManifestsOptionsFromEnv } from './common/utils/loader-options.utils';
import { createApp } from './core/bootstrap/create-app';
import { setupApp } from './core/bootstrap/app.setup';
import { config } from 'dotenv';
import { ensureTranslationsFlattened } from './core/i18n/scripts/translations-dev.helper';
config({path:['.env']})

async function bootstrap() {
   ensureTranslationsFlattened({
        force: process.env.NODE_ENV !== 'production',
    });
    const manifestOptions = getManifestsOptionsFromEnv();
    const app = await createApp(manifestOptions);

    await setupApp(app);

    const config = app.get(ConfigService);
    await app.listen(config.get<number>('PORT') ?? 3000);
}

void bootstrap();

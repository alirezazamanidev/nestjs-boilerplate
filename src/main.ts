
import { ConfigService } from '@nestjs/config';
import { getManifestsOptionsFromEnv } from './common/utils/loader-options.utils';
import { createApp } from './core/bootstrap/create-app';
import { setupApp } from './core/bootstrap/app.setup';
import { config } from 'dotenv';
config({path:['.env']})

async function bootstrap() {
   
    const manifestOptions = getManifestsOptionsFromEnv();
    const app = await createApp(manifestOptions);

    await setupApp(app);

    const config = app.get(ConfigService);
    await app.listen(config.get<number>('PORT') ?? 3000);
}

void bootstrap();

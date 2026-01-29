import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Setup } from '../setup.base';

export default class CorsSetup extends Setup {
    name = 'cors';
    order = 20;

    setup(app: INestApplication) {
        const cfg = app.get(ConfigService, { strict: false });
        const origins = cfg?.get<string[] | string>('CORS_ORIGINS') ?? '*';

        app.enableCors({
            origin: origins,
            credentials: true,
        });
    }
}

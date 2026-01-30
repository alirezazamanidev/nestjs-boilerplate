import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Setup } from '../setup.base';

export default class GlobalProvidersSetup extends Setup {
    name = 'global-providers';
    order = 90;
    isEnabled(): boolean {
        return false;
    }

    setup(app: INestApplication) {
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                transform: true,
                transformOptions: { enableImplicitConversion: true },
                exceptionFactory: (errors) => errors,
            }),
        );
    }
}

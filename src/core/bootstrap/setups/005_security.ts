import type { INestApplication } from '@nestjs/common';
import { Setup } from '../setup.base';

export default class SecurityHeaderSetup extends Setup {
    name = 'security-header';
    order = 5;

    setup(app: INestApplication) {
        const http = (
            app as {
                getHttpAdapter?: () => {
                    getInstance?: () => { disable?: (name: string) => void };
                };
            }
        ).getHttpAdapter?.();
        const instance = http?.getInstance?.();
        if (instance?.disable) {
            instance.disable('x-powered-by');
        }
    }
}

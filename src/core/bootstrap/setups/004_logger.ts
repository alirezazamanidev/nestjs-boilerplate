import { INestApplication } from "@nestjs/common";
import { Setup } from "../setup.base";
import { NestLoggerAdapter } from "src/core/logger/nest.logger.adapter";


export default class LoggerSetup extends Setup {
    name='logger';
    order=4
    isEnabled(): boolean | Promise<boolean> {
        return true
    }
  
    setup(app: INestApplication) {
        if (process.env.USE_APP_LOGGER_FOR_NEST === 'true') {
            app.useLogger(new NestLoggerAdapter());
        }
    }
}
import { INestApplication } from "@nestjs/common";
import { Setup } from "../setup.base";


export default class LoggerSetup extends Setup {
    name='logger';
    order=4
    isEnabled(): boolean | Promise<boolean> {
        return true
    }
    setup(app:INestApplication): void | Promise<void> {
        //Todo: implement logger setup
    }
}
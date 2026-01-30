import { Controller, Get } from "@nestjs/common";
import { get } from "http";

@Controller()
export class AppController {


    @Get('/check')
    check(){
        return 'ok'
    }
}
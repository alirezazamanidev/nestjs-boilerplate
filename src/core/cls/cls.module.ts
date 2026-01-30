import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ClsModule } from "nestjs-cls";
import { RequestContextMiddleware } from "./request.cls.middleware";

@Module({
    imports:[
        ClsModule.forRoot({
            global:true,
            middleware:{mount:true}
        })
    ]
})
export class AppClsModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestContextMiddleware).forRoutes('*')
    }
}
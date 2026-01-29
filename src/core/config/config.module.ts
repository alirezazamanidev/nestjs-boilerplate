import { DynamicModule, Module } from "@nestjs/common";
import { LoadConfigOptions } from "./config.types";
import { getConfigFactories, getEnvSchema } from "./config.loader";
import { ConfigModule as NestConfigModule } from '@nestjs/config';

@Module({})
export class ConfigModule {

    static async register(configOptions:LoadConfigOptions): Promise<DynamicModule> {

        const configs=await getConfigFactories(configOptions)
        const envSchema=await getEnvSchema(configOptions)
        
        return {
            module: ConfigModule,
            global:true,
            imports:[
                NestConfigModule.forRoot({
                    isGlobal:true,
                    cache:true,
                    expandVariables:false,
                    load:configs,
                    envFilePath:['.env'],
                    validationSchema:envSchema,
                    validationOptions:{
                        abortEarly:false
                        
                    }
                })
            ]
        }
    }
}
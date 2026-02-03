import { DynamicModule, Module } from "@nestjs/common";
import { CommandRunnerModule } from "nest-commander";
import { AppModule } from "src/app.module";
import { FeatureBundle } from "src/core/modules/manifest.types";
import { MigrateCommand } from "./migration/migrate.command";

@Module({})
export class CliModule {

    static register(bundle:FeatureBundle):DynamicModule{
        return {
            module:CliModule,
            imports:[
                AppModule.register(bundle,{profile:'cli'}),
                CommandRunnerModule
            ],
            providers:[
                MigrateCommand,
                {
                    provide:'BUNDLE',
                    useValue:bundle
                }
            ]
        }

    }
}
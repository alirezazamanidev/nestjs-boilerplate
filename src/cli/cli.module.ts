import { DynamicModule, Module } from "@nestjs/common";
import { CommandRunnerModule } from "nest-commander";
import { AppModule } from "src/app.module";
import { FeatureBundle } from "src/core/modules/manifest.types";
import { MigrateCommand } from "./migration/migrate.command";
import { SeedCommand } from "./migration/seed.command";
import { MigrateFreshCommand } from "./migration/migrate-fresh.command";
import { MigrateStatusCommand } from "./migration/migrate.status.command";
import { MigrateRollbackCommand } from "./migration/migrate.rollback.command";
import { MigrateMakeCommand } from "./migration/migrate.generate.command";
import { BundleBuildCommand } from "./module/bundle-build.command";

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
                BundleBuildCommand,
                SeedCommand,
                MigrateFreshCommand,
                MigrateStatusCommand,
                MigrateRollbackCommand,
                MigrateMakeCommand,
                {
                    provide:'BUNDLE',
                    useValue:bundle
                }
            ]
        }

    }
}
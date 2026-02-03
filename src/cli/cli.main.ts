import 'reflect-metadata';
import { CommandFactory } from 'nest-commander';
import { CliModule } from './cli.module';

import { ConfigService } from '@nestjs/config';
import { LoadManifestsOptions } from 'src/core/modules/manifest.types';
import { buildActiveBundle } from 'src/core/modules/manifest.loader';
import { NestLoggerAdapter } from 'src/core/logger/nest.logger.adapter';

const COMMANDER_HELP_ERROR_CODE = 'commander.help';
const LOG_LEVELS: ('error' | 'warn' | 'log')[] = ['error', 'warn', 'log'];

async function bootstrap(): Promise<void> {
    try {
        process.env.IS_CLI = 'true';

        const manifestOptions: LoadManifestsOptions = {
            forceReload: process.env.FORCE_RELOAD_MANIFESTS === 'true',
        };
        const bundle = await buildActiveBundle(manifestOptions);
        const cliModule = CliModule.register(bundle);
        const options = createCommandFactoryOptions();

        const app = await CommandFactory.createWithoutRunning(
            cliModule,
            options,
        );
        const configService = app.get(ConfigService);
        if (configService.get<boolean>('logger.useNestLoggerForCli')) {
            app.useLogger(new NestLoggerAdapter());
        }
        await CommandFactory.runApplication(app);
    } catch (error) {
        console.error('Failed to bootstrap CLI:', error);
        process.exitCode = 1;
    } finally {
        process.exit(process.exitCode ?? 0);
    }
}

function createErrorHandler(): (err: unknown) => void {
    return (err: unknown): void => {
        if (isCommanderHelpError(err)) {
            return; // Help command is not an error
        }

        console.error('CLI Error:', err);
        process.exitCode = 1;
    };
}

function isCommanderHelpError(err: unknown): boolean {
    return (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        err.code === COMMANDER_HELP_ERROR_CODE
    );
}

function createCommandFactoryOptions() {
    return {
        logger: LOG_LEVELS,
        errorHandler: createErrorHandler(),
    };
}

void bootstrap();

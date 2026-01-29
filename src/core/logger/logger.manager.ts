import { ClsServiceManager } from "nestjs-cls";
import { ConsoleAppLogger } from "./console.logger";
import { AppLogger, BaseBindings, CustomTransportSpec } from "./logger.interface";
import { LoggerDriverRegistery } from "./logger.registry";

export class LoggerManager {
    constructor(private readonly registry: LoggerDriverRegistery) {}

    private static _factory?: () => AppLogger;

    static registerFactory(factory: () => AppLogger) {
        this._factory = factory;
    }

    logger(bindings?: BaseBindings): AppLogger {
        const base = this.registry.getRoot();
        const merged = LoggerManager.resolveBindings(bindings);
        return Object.keys(merged).length ? base.child(merged) : base;
    }

    static resolveLogger(bindings?: BaseBindings): AppLogger {
        if (!this._factory) return new ConsoleAppLogger(bindings ?? {});
        const base = this._factory();

        const merged = LoggerManager.resolveBindings(bindings);

        return Object.keys(merged).length ? base.child(merged) : base;
    }

    static resolveBindings(bindings?: BaseBindings): BaseBindings {
        return {
            ...(bindings ?? {}),
            ...(ClsServiceManager.getClsService()?.get<string>('requestId')
                ? {
                      requestId:
                          ClsServiceManager.getClsService()?.get<string>(
                              'requestId',
                          ),
                  }
                : {}),
                //TODO add trace otel
            // ...(trace.getSpan(context.active())?.spanContext()
            //     ? {
            //           traceId: trace.getSpan(context.active())?.spanContext()
            //               ?.traceId,
            //           spanId: trace.getSpan(context.active())?.spanContext()
            //               ?.spanId,
            //       }
            //     : {}),
        };
    }

    getCustomLogger(
        spec: CustomTransportSpec,
        bindings?: BaseBindings,
    ): AppLogger {
        const drv = this.registry.getCurrentDriver();
        const base = drv.createCustomLogger
            ? drv.createCustomLogger(spec)
            : this.registry.getRoot();
        let rid: string | undefined;
        try {
            rid = ClsServiceManager.getClsService()?.get('requestId');
        } catch {
            // Ignore if CLS service is not available
        }
        const merged: BaseBindings = {
            ...(bindings ?? {}),
            ...(rid ? { requestId: rid } : {}),
        };
        return Object.keys(merged).length ? base.child(merged) : base;
    }

    static tryResolveLogger(bindings?: BaseBindings): AppLogger | null {
        try {
            return this.resolveLogger(bindings);
        } catch {
            return null;
        }
    }

    async switchTo(name: string, cfg: any) {
        await this.registry.switchTo(name, cfg);
        return this.logger();
    }
}

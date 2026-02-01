import { performance } from 'perf_hooks';
import { LoggerManager } from 'src/core/logger/logger.manager';

const ARGS_PREVIEW_LENGTH = 100;
const RESULT_PREVIEW_LENGTH = 200;
const DEFAULT_LEVEL = 'debug';

interface TraceOptions {
  tag?: string;
  logArgs?: boolean;
  logResult?: boolean;
  level?: 'debug' | 'info';
}
export const Trace = (opts: TraceOptions={}): MethodDecorator => {
  const {
    tag,
    logResult = false,
    logArgs = false,
    level = DEFAULT_LEVEL,
  } = opts;

  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const original = descriptor.value;
    if (typeof original !== 'function')
      throw new Error(`${original} is not a function`);

    const className = (target as { constructor?: { name?: string } })?.constructor?.name;
    const tagLabel = tag ?? (propertyKey as string);

    descriptor.value = function (...args: unknown[]) {
      const logger = LoggerManager.resolveLogger({ context: className || 'UnknownClass' });
      const start = performance.now();

      const enterPayload = createEnterPayload(tagLabel, propertyKey, className, args, logArgs);
      logger[level]({ eventName: 'trace.enter', body: enterPayload });

      let result: unknown;
      try {
        result = original.apply(this, args);

        if (result instanceof Promise) {
          return result
            .then(async (res) => {
              const durationMs = performance.now() - start;
              const exitPayload = createExitPayload(tagLabel, propertyKey, className, durationMs, res, logResult);
              logger[level]({ eventName: 'trace.exit', body: exitPayload });
              return res;
            })
            .catch((err) => {
              const durationMs = performance.now() - start;
              const errorPayload = createErrorPayload(tagLabel, propertyKey, className, durationMs, err);
              logger.error({ eventName: 'trace.error', body: errorPayload });
              throw err;
            });
        }

        const durationMs = performance.now() - start;
        const exitPayload = createExitPayload(tagLabel, propertyKey, className, durationMs, result, logResult);
        logger[level]({ eventName: 'trace.exit', body: exitPayload });
        return result;
      } catch (error) {
        const durationMs = performance.now() - start;
        const errorPayload = createErrorPayload(tagLabel, propertyKey, className, durationMs, error);
        logger.error({ eventName: 'trace.error', body: errorPayload });
        throw error;
      }
    };
  };
};

function createBasePayload(
  tag: string,
  propertyKey: string | symbol,
  className: string | undefined,
): Record<string, unknown> {
  return {
    tag,
    propertyKey,
    className: className || 'UnknownClass',
  };
}

function createEnterPayload(
  tag: string,
  propertyKey: string | symbol,
  className: string | undefined,
  args: unknown[],
  logArgs: boolean,
): Record<string, unknown> {
  const payload = {
    ...createBasePayload(tag, propertyKey, className),
    msg: 'trace_enter' as const,
  };

  if (logArgs && args.length > 0) {
    return {
      ...payload,
      argsPreview: args.map((arg) => arg),
    };
  }

  return payload;
}

function createExitPayload(
  tag: string,
  propertyKey: string | symbol,
  className: string | undefined,
  durationMs: number,
  result: unknown,
  logResult: boolean,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    ...createBasePayload(tag, propertyKey, className),
    msg: 'trace_exit',
    durationMs: Math.round(durationMs),
  };

  if (logResult) {
    payload.resultPreview = result;
  }

  return payload;
}

function createErrorPayload(
  tag: string,
  propertyKey: string | symbol,
  className: string | undefined,
  durationMs: number,
  error: unknown,
): Record<string, unknown> {
  const err = error as Error;
  return {
    ...createBasePayload(tag, propertyKey, className),
    msg: 'trace_error',
    durationMs: Math.round(durationMs),
    error: {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
    },
  };
}

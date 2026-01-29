export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type CustomTransportSpec =
  | { kind: 'console'; level?: LogLevel }
  | {
      kind: 'file-rotation';
      level?: LogLevel;
      destination?: string;
      auditFile?: string;
      rotation?: {
        frequency?: string;
        maxLogs?: number | string;
        dateFormat?: string;
      };
    }
  | { kind: 'file'; level?: LogLevel; destination?: string }
  | { kind: 'raw'; driverSpecific: any; level?: LogLevel };
export interface BaseBindings {
  service?: string; //service name
  env?: string; //dev, prod, test
  context?: string;
  module?: string;
  requestId?: string;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  userId?: string | number;
}
export type LogRecord = {
    eventName?: string;
    body?: Record<string, any>;
    bindings?: BaseBindings;
};
export interface AppLogger {
  child(bindings?: BaseBindings): AppLogger;
  trace(obj: LogRecord): void;
  debug(obj: LogRecord): void;
  info(obj: LogRecord): void;
  warn(obj: LogRecord): void;
  error(obj: LogRecord): void;
  fatal(obj: LogRecord): void;
}
export interface LoggerDriver {
  readonly name: string;
  createRootLogger(cfg: any): Promise<AppLogger> | AppLogger;
  close?(root: AppLogger): Promise<void> | void;
  createCustomLogger?(spec: CustomTransportSpec): AppLogger;
  closeAllCustoms?(): Promise<void> | void;
}

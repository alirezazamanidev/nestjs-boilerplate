import * as FileStreamRotator from 'file-stream-rotator';

export interface LogRotationOptions {
    filename: string;
    frequency?: string;
    maxLogs?: number | string;
    dateFormat?: string;
    auditFile?: string;
}

export function createFileRotator(
    opts: LogRotationOptions,
): NodeJS.WritableStream {
    const s = FileStreamRotator.getStream({
        filename: opts.filename ?? 'storage/logs/app-%DATE%.log',
        frequency: opts.frequency ?? 'daily',
        date_format: opts.dateFormat ?? 'YYYY-MM-DD',
        verbose: false,
        max_logs: opts.maxLogs?.toString() ?? '14d',
        audit_file: opts.auditFile ?? 'storage/logs/audit.json',
    });

    return s as unknown as NodeJS.WritableStream;
}

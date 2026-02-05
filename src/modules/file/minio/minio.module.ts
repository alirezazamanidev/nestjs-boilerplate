import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';

export const MINIO_CLIENT = 'MINIO_CLIENT';
@Global()
@Module({
  providers: [
    {
      provide: MINIO_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const rawEndpoint = config.get<string>(
          'file.minio.endpoint',
          'localhost',
        );

        // MinIO SDK expects a host only (no scheme/path). Users often paste full URLs.
        // Normalize to prevent malformed presigned URLs like `http://host:9000//bucket`.
        const normalized = rawEndpoint
          .replace(/^https?:\/\//i, '')
          .replace(/\/+$/, '');

        const match = normalized.match(/^([^:]+)(?::(\d+))?$/);
        const endPoint = match?.[1] || 'localhost';
        const endpointPort = match?.[2] ? Number(match[2]) : undefined;

        const portFromConfig = config.get<number>('file.minio.port', 9000);
        const port = Number.isFinite(endpointPort)
          ? (endpointPort as number)
          : portFromConfig;
        return new MinioClient({
          endPoint,
          port,
          useSSL: config.get<boolean>('file.minio.secure', false),
          accessKey: config.get<string>('file.minio.accessKey', 'minioadmin'),
          secretKey: config.get<string>('file.minio.secretKey', 'minioadmin'),
        });
      },
    },
  ],
  exports:[MINIO_CLIENT]
})
export class MinioModule {}

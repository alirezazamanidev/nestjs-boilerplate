import { de } from '@faker-js/faker';
import { registerAs } from '@nestjs/config';

export default registerAs('file', () => ({
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    secure: process.env.MINIO_SECURE === 'true',
    bucket: process.env.MINIO_BUCKET || 'files',

    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  },
}));

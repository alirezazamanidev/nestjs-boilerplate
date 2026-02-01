import { Global, Module } from '@nestjs/common';
import { DatabaseDriverRegistery } from './driver.registery';
import { PostgresDriver } from './drivers/postgres.driver';

import { ConfigService } from '@nestjs/config';
import { MySQLDriver } from './drivers/mysql.driver';
import { DatabaseService } from './database.service';
@Global()
@Module({
  providers: [
    DatabaseDriverRegistery,
    MySQLDriver,
    PostgresDriver,

    {
      provide: DatabaseService,
      inject: [
        ConfigService,
        DatabaseDriverRegistery,
        MySQLDriver,
        PostgresDriver,
      ],
      useFactory: async (
        cfg: ConfigService,
        reg:DatabaseDriverRegistery,
        pgDriver: PostgresDriver,
        mysqlDriver: MySQLDriver,
      ) => {
        reg.register(pgDriver)
        reg.register(mysqlDriver);
        const chosen=cfg.get('db.type') || 'mysql';
        await reg.init(chosen);
        return new DatabaseService(reg)
      },
    },
  ],
})
export class DatabaseModule {}

import { Injectable } from '@nestjs/common';
import { DatabaseDriverRegistery } from './driver.registery';
import { DatabaseDriver } from './interfaces';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  private driver: DatabaseDriver;
  constructor(private registery: DatabaseDriverRegistery) {
    this.driver = registery.currentDriver;
  }

  get dataSource(): DataSource | undefined {
    return this.driver?.dataSource;
  }

  create<T>(table: string, data: Partial<T>) {
    return this.driver.create(table, data);
  }

  find<T>(table: string, conditions?: Partial<T>) {
    return this.driver.find(table, conditions);
  }

  findOne<T>(table: string, conditions?: Partial<T>) {
    return this.driver.findOne(table, conditions);
  }

  findById<T>(table: string, id: string | number) {
    return this.driver.findById(table, id);
  }

  update<T>(table: string, conditions: Partial<T>, data?: Partial<T>) {
    return this.driver.update(table, conditions, data);
  }

  delete<T>(table: string, conditions: Partial<T>) {
    return this.driver.delete(table, conditions);
  }
}

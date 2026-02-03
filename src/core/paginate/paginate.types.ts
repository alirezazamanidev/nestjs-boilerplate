import { PaginateConfig, Paginated as NestPaginated } from 'nestjs-paginate';
import { Column } from 'nestjs-paginate/lib/helper';
import { ObjectLiteral } from 'typeorm';
import { FullTextSearchDriver } from './drivers/fts.interface';

export type TPaginateConfig<T extends ObjectLiteral> = PaginateConfig<T> & {
  fullTextSearchableColumns?: Column<T>[];
  fullTextSearchDriver?: FullTextSearchDriver<T>;
};

export class Paginated<T> {
  data: T[];
  meta: NestPaginated<T>['meta'] & { fullTextSearchBy: string[] };
  links: NestPaginated<T>['links'];

  constructor(init: {
    data: T[];
    meta: Paginated<T>['meta'];
    links: Paginated<T>['links'];
  }) {
    this.data = init.data;
    this.meta = init.meta;
    this.links = init.links;
  }
}

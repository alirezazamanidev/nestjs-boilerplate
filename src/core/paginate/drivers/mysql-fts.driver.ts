import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { FullTextSearchDriver } from './fts.interface';

export class MySQLFullTextSearchDriver<
  T extends ObjectLiteral,
  O,
> implements FullTextSearchDriver<T, O> {
  applySearch(
    qb: SelectQueryBuilder<T>,
    search: string,
    searchableColumns: string[],
    allowPartialMatch?: boolean,
  ): SelectQueryBuilder<T> {
    const processedSearch = allowPartialMatch
      ? search
          .split(' ')
          .map((word) => `*${word}*`)
          .join(' ')
      : search;

    qb.where(
      `MATCH(${searchableColumns.join(', ')}) AGAINST (:search IN BOOLEAN MODE)`,
      { search: processedSearch },
    );
    return qb;
  }
}

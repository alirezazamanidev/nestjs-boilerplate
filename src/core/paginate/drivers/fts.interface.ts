import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export interface FullTextSearchDriver<T extends ObjectLiteral, O = object> {
    applySearch(
        qb: SelectQueryBuilder<T>,
        search: string,
        searchableColumns: string[],
        allowPartialMatch?: boolean,
        options?: O,
    ): SelectQueryBuilder<T>;
}

import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { PaginateQuery } from 'nestjs-paginate';
import { Paginated, TPaginateConfig } from './paginate.types';
import { paginate as nestPaginate } from 'nestjs-paginate';

export const paginate = async <T extends ObjectLiteral>(
  query: PaginateQuery,
  repo: Repository<T> | SelectQueryBuilder<T>,
  config: TPaginateConfig<T>,
): Promise<Paginated<T>> => {
  const { fullTextSearchDriver, fullTextSearchableColumns, ...restConfig } =
    config;
  const isQueryBuilderInst = repo instanceof SelectQueryBuilder;
  const qb = isQueryBuilderInst ? repo : repo.createQueryBuilder();
  if (
    fullTextSearchDriver &&
    fullTextSearchableColumns?.length &&
    query.search
  ) {
    fullTextSearchDriver.applySearch(
      qb,
      query.search,
      fullTextSearchableColumns,
      !restConfig.searchableColumns?.length,
    );
  }
  const paginated = await nestPaginate(query, qb, restConfig);
  const paginatedInst = new Paginated({
    data: paginated.data,
    links: paginated.links,
    meta: {
      ...paginated.meta,
      fullTextSearchBy: fullTextSearchableColumns || [],
    },
  });
  return paginatedInst;
};

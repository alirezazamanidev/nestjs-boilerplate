import { PaginateQuery } from "nestjs-paginate";
import { Paginated, TPaginateConfig } from "./paginate.types";
import { paginate } from "./paginate";

declare module 'typeorm' {
    interface SelectQueryBuilder<Entity>{
        paginate:(query:PaginateQuery,config:TPaginateConfig<Entity>)=>Promise<Paginated<Entity>>;
    }
}

SelectQueryBuilder.prototype.paginate = function (query, config) {
    return paginate(query, this, config);
};

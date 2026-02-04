export type TCacheSetOptions = {
    ttl?: number;
};

export type TCacheMSetItem<T> = {
    key: string;
    value: T;
    ttl?: number;
};

export type TCacheGetSetCbOptions<T> = {
    ttl?: number | ((value: T) => number);
    refreshThreshold?: number | ((value: T) => number);
};

export type TCacheGetSetCbOptionsRaw<T> = TCacheGetSetCbOptions<T> & {
    raw: true;
};

export type TCacheGetSetValueOptions = TCacheSetOptions;

type TDeserializedData<Value> = {
    value?: Value;
    expires?: number | undefined;
};

export type TStoredDataRaw<Value> = TDeserializedData<Value> | undefined;

export interface ICacheManager {
    get<T>(key: string): Promise<T | undefined>;
    mget<T>(keys: string[]): Promise<Array<T | undefined>>;
    set<T>(key: string, value: T, options?: TCacheSetOptions): Promise<T>;
    mset<T>(list: TCacheMSetItem<T>[]): Promise<TCacheMSetItem<T>[]>;
    getSet<T>(
        key: string,
        cb: () => T | Promise<T>,
        options?: TCacheGetSetCbOptions<T>,
    ): Promise<T>;
    getSet<T>(
        key: string,
        cb: () => T | Promise<T>,
        options?: TCacheGetSetCbOptionsRaw<T>,
    ): Promise<TStoredDataRaw<T>>;
    getSet<T>(
        key: string,
        value: T | Promise<T>,
        options?: TCacheGetSetValueOptions,
    ): Promise<T | undefined>;
    del(key: string): Promise<boolean>;
    mdel(keys: string[]): Promise<boolean>;
}

import { DataSource, DeepPartial } from "typeorm";

export interface DatabaseDriver {
    name:string
  /**
   * Establishes a connection to the database.
   */
  connect(): Promise<void>;

  /**
   * Closes the current database connection.
   */
  disconnect(): Promise<void>;

    /**
     * Inserts a new record into the specified table.
     * @param table - Name of the database table or collection.
     * @param data - Record to insert.
     * @returns The created record or database response.
     */
    create<T extends Record<string, any> = Record<string, any>>(
        table: string,
        data: DeepPartial<T>,
    ): Promise<T>;

    /**
     * Finds multiple records matching the given conditions.
     * @param table - Name of the table or collection.
     * @param conditions - Filter conditions.
     * @returns An array of matching records.
     */
    find<T extends Record<string, any> = Record<string, any>>(
        table: string,
        conditions?: Partial<T>,
    ): Promise<T[]>;

    /**
     * Finds a single record matching the given conditions.
     * @param table - Name of the table or collection.
     * @param conditions - Filter conditions.
     * @returns The matching record or null if not found.
     */
    findOne<T extends Record<string, any> = Record<string, any>>(
        table: string,
        conditions?: Partial<T>,
    ): Promise<T | null>;

    /**
     * Finds a single record by its ID.
     * @param table - Name of the table or collection.
     * @param id - The ID of the record to find.
     * @returns The matching record or null if not found.
     */
    findById<T extends Record<string, any> = Record<string, any>>(
        table: string,
        id: string | number,
    ): Promise<T | null>;
  /**
     * Updates records that match the given conditions.
     * @param table - Name of the table or collection.
     * @param conditions - Filter conditions.
     * @param data - Data to update.
     * @returns The updated record(s) or database response.
     */
    update<T extends Record<string, any> = Record<string, any>>(
        table: string,
        conditions: Partial<T>,
        data?: DeepPartial<T>,
    ): Promise<boolean>;
  /**
     * Deletes records that match the given conditions.
     * @param table - Name of the table or collection.
     * @param conditions - Filter conditions.
     * @returns The result of the delete operation.
     */
    delete<T extends Record<string, any> = Record<string, any>>(
        table: string,
        conditions: Partial<T>,
    ): Promise<boolean>;
    dataSource?:DataSource
}

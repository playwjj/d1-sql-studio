import { Env, TableInfo, ColumnInfo } from './types';
import { validateIdentifier, validateIdentifiers, quoteIdentifier, validateRowData, validatePagination } from './security';

export class D1Manager {
  constructor(private db: D1Database) {}

  async listTables(): Promise<TableInfo[]> {
    const result = await this.db
      .prepare("SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name")
      .all<TableInfo>();

    return result.results || [];
  }

  async getTableSchema(tableName: string): Promise<ColumnInfo[]> {
    // Validate table name to prevent SQL injection
    validateIdentifier(tableName, 'table name');

    const result = await this.db
      .prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`)
      .all<ColumnInfo>();

    return result.results || [];
  }

  async executeQuery(sql: string, params: any[] = []) {
    // This method is validated in the router before calling
    // Additional validation is done there to ensure only SELECT/PRAGMA queries
    const stmt = this.db.prepare(sql);

    if (params.length > 0) {
      return await stmt.bind(...params).all();
    }

    return await stmt.all();
  }

  async getTableData(tableName: string, page: number = 1, limit: number = 50) {
    // Validate table name to prevent SQL injection
    validateIdentifier(tableName, 'table name');

    // Validate and sanitize pagination parameters
    const validated = validatePagination(page, limit);
    const offset = (validated.page - 1) * validated.limit;

    const quotedTable = quoteIdentifier(tableName);

    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM ${quotedTable}`)
      .first<{ count: number }>();

    const dataResult = await this.db
      .prepare(`SELECT * FROM ${quotedTable} LIMIT ? OFFSET ?`)
      .bind(validated.limit, offset)
      .all();

    return {
      data: dataResult.results,
      total: countResult?.count || 0,
      page: validated.page,
      limit: validated.limit
    };
  }

  async getRow(tableName: string, id: string | number) {
    // Validate table name to prevent SQL injection
    validateIdentifier(tableName, 'table name');

    const schema = await this.getTableSchema(tableName);
    const pkColumn = schema.find(col => col.pk === 1);

    if (!pkColumn) {
      throw new Error('No primary key found for table');
    }

    // Validate primary key column name
    validateIdentifier(pkColumn.name, 'column name');

    const quotedTable = quoteIdentifier(tableName);
    const quotedPK = quoteIdentifier(pkColumn.name);

    return await this.db
      .prepare(`SELECT * FROM ${quotedTable} WHERE ${quotedPK} = ?`)
      .bind(id)
      .first();
  }

  async insertRow(tableName: string, data: Record<string, any>) {
    // Validate table name to prevent SQL injection
    validateIdentifier(tableName, 'table name');

    // Validate data and column names
    validateRowData(data);

    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');

    // Quote all identifiers
    const quotedTable = quoteIdentifier(tableName);
    const quotedColumns = columns.map(col => quoteIdentifier(col)).join(', ');

    const sql = `INSERT INTO ${quotedTable} (${quotedColumns}) VALUES (${placeholders})`;

    return await this.db
      .prepare(sql)
      .bind(...values)
      .run();
  }

  async updateRow(tableName: string, id: string | number, data: Record<string, any>) {
    // Validate table name to prevent SQL injection
    validateIdentifier(tableName, 'table name');

    // Validate data and column names
    validateRowData(data);

    const schema = await this.getTableSchema(tableName);
    const pkColumn = schema.find(col => col.pk === 1);

    if (!pkColumn) {
      throw new Error('No primary key found for table');
    }

    // Validate primary key column name
    validateIdentifier(pkColumn.name, 'column name');

    const columns = Object.keys(data);
    const values = Object.values(data);

    // Quote all identifiers
    const quotedTable = quoteIdentifier(tableName);
    const quotedPK = quoteIdentifier(pkColumn.name);
    const setClause = columns.map(col => `${quoteIdentifier(col)} = ?`).join(', ');

    const sql = `UPDATE ${quotedTable} SET ${setClause} WHERE ${quotedPK} = ?`;

    return await this.db
      .prepare(sql)
      .bind(...values, id)
      .run();
  }

  async deleteRow(tableName: string, id: string | number) {
    // Validate table name to prevent SQL injection
    validateIdentifier(tableName, 'table name');

    const schema = await this.getTableSchema(tableName);
    const pkColumn = schema.find(col => col.pk === 1);

    if (!pkColumn) {
      throw new Error('No primary key found for table');
    }

    // Validate primary key column name
    validateIdentifier(pkColumn.name, 'column name');

    const quotedTable = quoteIdentifier(tableName);
    const quotedPK = quoteIdentifier(pkColumn.name);

    return await this.db
      .prepare(`DELETE FROM ${quotedTable} WHERE ${quotedPK} = ?`)
      .bind(id)
      .run();
  }

  async createTable(sql: string) {
    // Note: CREATE TABLE statements are validated in the router
    // to ensure they don't contain dangerous operations
    return await this.db.prepare(sql).run();
  }

  async dropTable(tableName: string) {
    // Validate table name to prevent SQL injection
    validateIdentifier(tableName, 'table name');

    const quotedTable = quoteIdentifier(tableName);

    return await this.db.prepare(`DROP TABLE ${quotedTable}`).run();
  }
}

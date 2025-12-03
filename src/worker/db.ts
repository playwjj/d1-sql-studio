import { Env, TableInfo, ColumnInfo } from './types';

export class D1Manager {
  constructor(private db: D1Database) {}

  async listTables(): Promise<TableInfo[]> {
    const result = await this.db
      .prepare("SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name")
      .all<TableInfo>();

    return result.results || [];
  }

  async getTableSchema(tableName: string): Promise<ColumnInfo[]> {
    const result = await this.db
      .prepare(`PRAGMA table_info(${tableName})`)
      .all<ColumnInfo>();

    return result.results || [];
  }

  async executeQuery(sql: string, params: any[] = []) {
    const stmt = this.db.prepare(sql);

    if (params.length > 0) {
      return await stmt.bind(...params).all();
    }

    return await stmt.all();
  }

  async getTableData(tableName: string, page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;

    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
      .first<{ count: number }>();

    const dataResult = await this.db
      .prepare(`SELECT * FROM ${tableName} LIMIT ? OFFSET ?`)
      .bind(limit, offset)
      .all();

    return {
      data: dataResult.results,
      total: countResult?.count || 0,
      page,
      limit
    };
  }

  async getRow(tableName: string, id: string | number) {
    const schema = await this.getTableSchema(tableName);
    const pkColumn = schema.find(col => col.pk === 1);

    if (!pkColumn) {
      throw new Error('No primary key found for table');
    }

    return await this.db
      .prepare(`SELECT * FROM ${tableName} WHERE ${pkColumn.name} = ?`)
      .bind(id)
      .first();
  }

  async insertRow(tableName: string, data: Record<string, any>) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');

    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    return await this.db
      .prepare(sql)
      .bind(...values)
      .run();
  }

  async updateRow(tableName: string, id: string | number, data: Record<string, any>) {
    const schema = await this.getTableSchema(tableName);
    const pkColumn = schema.find(col => col.pk === 1);

    if (!pkColumn) {
      throw new Error('No primary key found for table');
    }

    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');

    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${pkColumn.name} = ?`;

    return await this.db
      .prepare(sql)
      .bind(...values, id)
      .run();
  }

  async deleteRow(tableName: string, id: string | number) {
    const schema = await this.getTableSchema(tableName);
    const pkColumn = schema.find(col => col.pk === 1);

    if (!pkColumn) {
      throw new Error('No primary key found for table');
    }

    return await this.db
      .prepare(`DELETE FROM ${tableName} WHERE ${pkColumn.name} = ?`)
      .bind(id)
      .run();
  }

  async createTable(sql: string) {
    return await this.db.prepare(sql).run();
  }

  async dropTable(tableName: string) {
    return await this.db.prepare(`DROP TABLE ${tableName}`).run();
  }
}

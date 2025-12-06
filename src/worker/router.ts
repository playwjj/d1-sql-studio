import { Env, ApiResponse } from './types';
import { D1Manager } from './db';
import { createApiKey, listApiKeys, deleteApiKey, hasAnyApiKeys } from './apikeys';
import { validateSQLStatement } from './security';

export class Router {
  private dbManager: D1Manager;

  constructor(private env: Env) {
    // Check if D1 database is bound
    if (!env.DB) {
      throw new Error('DATABASE_NOT_BOUND');
    }
    this.dbManager = new D1Manager(env.DB);
  }

  async route(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // API Key Management Routes
      if (method === 'GET' && path === '/api/keys/status') {
        return await this.checkKeysStatus();
      }

      if (method === 'POST' && path === '/api/keys') {
        return await this.createKey(request);
      }

      if (method === 'GET' && path === '/api/keys') {
        return await this.listKeys();
      }

      if (method === 'DELETE' && path.match(/^\/api\/keys\/[^/]+$/)) {
        const name = decodeURIComponent(path.split('/')[3]);
        return await this.deleteKey(name);
      }

      // Database Routes
      if (method === 'GET' && path === '/api/tables') {
        return await this.listTables();
      }

      if (method === 'GET' && path.match(/^\/api\/tables\/[^/]+\/schema$/)) {
        const tableName = path.split('/')[3];
        return await this.getTableSchema(tableName);
      }

      if (method === 'POST' && path === '/api/query') {
        return await this.executeQuery(request);
      }

      if (method === 'POST' && path === '/api/tables') {
        return await this.createTable(request);
      }

      if (method === 'DELETE' && path.match(/^\/api\/tables\/[^/]+$/)) {
        const tableName = path.split('/')[3];
        return await this.dropTable(tableName);
      }

      if (method === 'GET' && path.match(/^\/api\/tables\/[^/]+\/rows$/)) {
        const tableName = path.split('/')[3];
        const field = url.searchParams.get('field');
        const value = url.searchParams.get('value');

        // If field and value are provided, query by custom field
        if (field && value) {
          return await this.getRowByField(tableName, field, value);
        }

        // Otherwise, return paginated list
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const sortBy = url.searchParams.get('sortBy') || undefined;
        const sortOrder = (url.searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
        const search = url.searchParams.get('search') || undefined;
        return await this.getTableData(tableName, page, limit, sortBy, sortOrder, search);
      }

      if (method === 'GET' && path.match(/^\/api\/tables\/[^/]+\/rows\/[^/]+$/)) {
        const parts = path.split('/');
        const tableName = parts[3];
        const id = parts[5];
        return await this.getRow(tableName, id);
      }

      if (method === 'POST' && path.match(/^\/api\/tables\/[^/]+\/rows$/)) {
        const tableName = path.split('/')[3];
        return await this.insertRow(request, tableName);
      }

      if (method === 'PUT' && path.match(/^\/api\/tables\/[^/]+\/rows\/[^/]+$/)) {
        const parts = path.split('/');
        const tableName = parts[3];
        const id = parts[5];
        return await this.updateRow(request, tableName, id);
      }

      if (method === 'DELETE' && path.match(/^\/api\/tables\/[^/]+\/rows\/[^/]+$/)) {
        const parts = path.split('/');
        const tableName = parts[3];
        const id = parts[5];
        return await this.deleteRow(tableName, id);
      }

      // Table schema modification routes
      if (method === 'POST' && path.match(/^\/api\/tables\/[^/]+\/columns$/)) {
        const tableName = decodeURIComponent(path.split('/')[3]);
        return await this.addColumn(request, tableName);
      }

      if (method === 'DELETE' && path.match(/^\/api\/tables\/[^/]+\/columns\/[^/]+$/)) {
        const parts = path.split('/');
        const tableName = decodeURIComponent(parts[3]);
        const columnName = decodeURIComponent(parts[5]);
        return await this.dropColumn(tableName, columnName);
      }

      if (method === 'PUT' && path.match(/^\/api\/tables\/[^/]+\/columns\/[^/]+$/)) {
        const parts = path.split('/');
        const tableName = decodeURIComponent(parts[3]);
        const oldColumnName = decodeURIComponent(parts[5]);
        return await this.renameColumn(request, tableName, oldColumnName);
      }

      if (method === 'PUT' && path.match(/^\/api\/tables\/[^/]+\/rename$/)) {
        const tableName = decodeURIComponent(path.split('/')[3]);
        return await this.renameTable(request, tableName);
      }

      return this.jsonResponse({ success: false, error: 'Not found' }, 404);
    } catch (error: any) {
      return this.jsonResponse({ success: false, error: error.message }, 500);
    }
  }

  private async listTables(): Promise<Response> {
    const tables = await this.dbManager.listTables();
    return this.jsonResponse({ success: true, data: tables });
  }

  private async getTableSchema(tableName: string): Promise<Response> {
    const schema = await this.dbManager.getTableSchema(tableName);
    return this.jsonResponse({ success: true, data: schema });
  }

  private async executeQuery(request: Request): Promise<Response> {
    const body = await request.json<{ sql: string; params?: any[] }>();

    // SECURITY: Validate SQL to allow data operations (SELECT, INSERT, UPDATE, DELETE, PRAGMA)
    // Still blocks dangerous schema changes (DROP, CREATE, ALTER, TRUNCATE)
    validateSQLStatement(body.sql);

    const result = await this.dbManager.executeQuery(body.sql, body.params);
    return this.jsonResponse({ success: true, data: result });
  }

  private async createTable(request: Request): Promise<Response> {
    const body = await request.json<{ sql: string }>();

    // SECURITY: Validate CREATE TABLE statement
    if (!body.sql || typeof body.sql !== 'string') {
      return this.jsonResponse({ success: false, error: 'Invalid SQL: must be a non-empty string' }, 400);
    }

    const trimmed = body.sql.trim().toUpperCase();

    // Only allow CREATE TABLE statements
    if (!trimmed.startsWith('CREATE TABLE')) {
      return this.jsonResponse({ success: false, error: 'Only CREATE TABLE statements are allowed' }, 400);
    }

    // Check for multiple statements (semicolons outside of quoted strings)
    const statements = body.sql.split(';').filter(s => s.trim());
    if (statements.length > 1) {
      return this.jsonResponse({ success: false, error: 'Multiple SQL statements not allowed' }, 400);
    }

    // Remove quoted identifiers and string literals to check for dangerous patterns
    // This allows keywords like "update", "delete" when used as properly quoted column names
    const sqlWithoutQuotedContent = body.sql
      .replace(/"[^"]*"/g, '""')  // Remove double-quoted identifiers
      .replace(/'[^']*'/g, "''")  // Remove single-quoted string literals
      .replace(/`[^`]*`/g, '``')  // Remove backtick-quoted identifiers
      .toUpperCase();

    // Check for dangerous keywords that shouldn't appear outside of quoted identifiers
    // These indicate actual SQL operations, not column names
    const dangerousInCreateTable = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'EXEC', 'EXECUTE', 'ALTER', 'ATTACH', 'DETACH'];
    for (const keyword of dangerousInCreateTable) {
      // Use word boundary regex to match whole words only
      const keywordPattern = new RegExp(`\\b${keyword}\\b`);
      if (keywordPattern.test(sqlWithoutQuotedContent)) {
        return this.jsonResponse({ success: false, error: `CREATE TABLE statement cannot contain SQL command: ${keyword}` }, 400);
      }
    }

    // Check for SQL injection patterns
    if (/--/.test(body.sql) || /\/\*/.test(body.sql)) {
      return this.jsonResponse({ success: false, error: 'SQL comments are not allowed in CREATE TABLE statements' }, 400);
    }

    const result = await this.dbManager.createTable(body.sql);
    return this.jsonResponse({ success: true, data: result });
  }

  private async dropTable(tableName: string): Promise<Response> {
    const result = await this.dbManager.dropTable(tableName);
    return this.jsonResponse({ success: true, data: result });
  }

  private async getTableData(
    tableName: string,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc',
    search?: string
  ): Promise<Response> {
    const result = await this.dbManager.getTableData(tableName, page, limit, sortBy, sortOrder, search);
    return this.jsonResponse({
      success: true,
      data: result.data,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total
      }
    });
  }

  private async getRow(tableName: string, id: string): Promise<Response> {
    const row = await this.dbManager.getRow(tableName, id);
    return this.jsonResponse({ success: true, data: row });
  }

  private async getRowByField(tableName: string, field: string, value: string): Promise<Response> {
    const row = await this.dbManager.getRowByField(tableName, field, value);
    if (!row) {
      return this.jsonResponse({ success: false, error: 'Row not found' }, 404);
    }
    return this.jsonResponse({ success: true, data: row });
  }

  private async insertRow(request: Request, tableName: string): Promise<Response> {
    const data = await request.json<Record<string, any>>();
    const result = await this.dbManager.insertRow(tableName, data);
    return this.jsonResponse({ success: true, data: result });
  }

  private async updateRow(request: Request, tableName: string, id: string): Promise<Response> {
    const data = await request.json<Record<string, any>>();
    const result = await this.dbManager.updateRow(tableName, id, data);
    return this.jsonResponse({ success: true, data: result });
  }

  private async deleteRow(tableName: string, id: string): Promise<Response> {
    const result = await this.dbManager.deleteRow(tableName, id);
    return this.jsonResponse({ success: true, data: result });
  }

  // API Key Management Methods
  private async checkKeysStatus(): Promise<Response> {
    const hasKeys = await hasAnyApiKeys(this.env);
    return this.jsonResponse({ success: true, data: { hasKeys } });
  }

  private async createKey(request: Request): Promise<Response> {
    const body = await request.json<{ name: string; description?: string }>();

    // Check if this is first-time setup (no authentication header)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      // Only allow if no keys exist yet
      const hasKeys = await hasAnyApiKeys(this.env);
      if (hasKeys) {
        return this.jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }
    }

    const keyData = await createApiKey(this.env, body.name, body.description);
    return this.jsonResponse({ success: true, data: keyData });
  }

  private async listKeys(): Promise<Response> {
    const keys = await listApiKeys(this.env);
    return this.jsonResponse({ success: true, data: keys });
  }

  private async deleteKey(name: string): Promise<Response> {
    await deleteApiKey(this.env, name);
    return this.jsonResponse({ success: true });
  }

  // Table schema modification methods
  private async addColumn(request: Request, tableName: string): Promise<Response> {
    const body = await request.json<{ columnName: string; columnType: string; constraints?: string }>();

    if (!body.columnName || !body.columnType) {
      return this.jsonResponse({ success: false, error: 'Column name and type are required' }, 400);
    }

    const result = await this.dbManager.addColumn(tableName, body.columnName, body.columnType, body.constraints);
    return this.jsonResponse({ success: true, data: result });
  }

  private async dropColumn(tableName: string, columnName: string): Promise<Response> {
    const result = await this.dbManager.dropColumn(tableName, columnName);
    return this.jsonResponse({ success: true, data: result });
  }

  private async renameColumn(request: Request, tableName: string, oldColumnName: string): Promise<Response> {
    const body = await request.json<{ newColumnName: string }>();

    if (!body.newColumnName) {
      return this.jsonResponse({ success: false, error: 'New column name is required' }, 400);
    }

    const result = await this.dbManager.renameColumn(tableName, oldColumnName, body.newColumnName);
    return this.jsonResponse({ success: true, data: result });
  }

  private async renameTable(request: Request, tableName: string): Promise<Response> {
    const body = await request.json<{ newTableName: string }>();

    if (!body.newTableName) {
      return this.jsonResponse({ success: false, error: 'New table name is required' }, 400);
    }

    const result = await this.dbManager.renameTable(tableName, body.newTableName);
    return this.jsonResponse({ success: true, data: result });
  }

  private jsonResponse<T>(data: ApiResponse<T>, status: number = 200): Response {
    return new Response(JSON.stringify(data, null, 2), {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

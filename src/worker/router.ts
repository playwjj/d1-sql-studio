import { Env, ApiResponse } from './types';
import { D1Manager } from './db';
import { createApiKey, listApiKeys, deleteApiKey, hasAnyApiKeys } from './apikeys';

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
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        return await this.getTableData(tableName, page, limit);
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
    const result = await this.dbManager.executeQuery(body.sql, body.params);
    return this.jsonResponse({ success: true, data: result });
  }

  private async createTable(request: Request): Promise<Response> {
    const body = await request.json<{ sql: string }>();
    const result = await this.dbManager.createTable(body.sql);
    return this.jsonResponse({ success: true, data: result });
  }

  private async dropTable(tableName: string): Promise<Response> {
    const result = await this.dbManager.dropTable(tableName);
    return this.jsonResponse({ success: true, data: result });
  }

  private async getTableData(tableName: string, page: number, limit: number): Promise<Response> {
    const result = await this.dbManager.getTableData(tableName, page, limit);
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
    const body = await request.json<{ name: string }>();

    // Check if this is first-time setup (no authentication header)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      // Only allow if no keys exist yet
      const hasKeys = await hasAnyApiKeys(this.env);
      if (hasKeys) {
        return this.jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }
    }

    const keyData = await createApiKey(this.env, body.name);
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

  private jsonResponse<T>(data: ApiResponse<T>, status: number = 200): Response {
    return new Response(JSON.stringify(data, null, 2), {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

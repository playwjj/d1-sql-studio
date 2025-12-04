export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export class ApiClient {
  constructor(private apiKey: string) {}

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const response = await fetch(endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    return response.json();
  }

  async listTables() {
    return this.request('/tables');
  }

  async getTableSchema(tableName: string) {
    return this.request(`/tables/${tableName}/schema`);
  }

  async getTableData(tableName: string, page = 1, limit = 50) {
    return this.request(`/tables/${tableName}/rows?page=${page}&limit=${limit}`);
  }

  async executeQuery(sql: string, params?: any[]) {
    return this.request('/query', {
      method: 'POST',
      body: JSON.stringify({ sql, params }),
    });
  }

  async createTable(sql: string) {
    return this.request('/tables', {
      method: 'POST',
      body: JSON.stringify({ sql }),
    });
  }

  async deleteTable(tableName: string) {
    return this.request(`/tables/${tableName}`, {
      method: 'DELETE',
    });
  }

  async insertRow(tableName: string, data: Record<string, any>) {
    return this.request(`/tables/${tableName}/rows`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRow(tableName: string, id: string, data: Record<string, any>) {
    return this.request(`/tables/${tableName}/rows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRow(tableName: string, id: string) {
    return this.request(`/tables/${tableName}/rows/${id}`, {
      method: 'DELETE',
    });
  }

  async addColumn(tableName: string, columnName: string, columnType: string, constraints?: string) {
    return this.request(`/tables/${tableName}/columns`, {
      method: 'POST',
      body: JSON.stringify({ columnName, columnType, constraints }),
    });
  }

  async dropColumn(tableName: string, columnName: string) {
    return this.request(`/tables/${tableName}/columns/${columnName}`, {
      method: 'DELETE',
    });
  }

  async renameColumn(tableName: string, oldColumnName: string, newColumnName: string) {
    return this.request(`/tables/${tableName}/columns/${oldColumnName}`, {
      method: 'PUT',
      body: JSON.stringify({ newColumnName }),
    });
  }

  async renameTable(oldTableName: string, newTableName: string) {
    return this.request(`/tables/${oldTableName}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ newTableName }),
    });
  }
}

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

export interface JoinConfig {
  table: string;
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'CROSS';
  on?: string;  // Join condition, e.g., "users.id = orders.user_id"
}

export interface JoinQueryRequest {
  baseTable: string;
  joins: JoinConfig[];
  select?: string[];  // Columns to select, defaults to ["*"]
  where?: string;     // WHERE clause
  groupBy?: string[]; // GROUP BY columns
  having?: string;    // HAVING clause
  orderBy?: string;   // ORDER BY clause, e.g., "created_at DESC"
  limit?: number;
  offset?: number;
  params?: any[];     // Parameters for WHERE/HAVING conditions
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

  async getTableData(
    tableName: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc',
    search?: string,
    sort?: string  // Multi-field sort parameter, format: 'name:asc,created_at:desc'
  ) {
    let url = `/tables/${tableName}/rows?page=${page}&limit=${limit}`;

    // Prioritize 'sort' parameter (multi-field sorting)
    if (sort) {
      url += `&sort=${encodeURIComponent(sort)}`;
    }
    // Fallback to single-field sorting (backward compatibility)
    else if (sortBy) {
      url += `&sortBy=${encodeURIComponent(sortBy)}&sortOrder=${sortOrder}`;
    }

    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.request(url);
  }

  async executeQuery(sql: string, params?: any[]) {
    return this.request('/query', {
      method: 'POST',
      body: JSON.stringify({ sql, params }),
    });
  }

  async joinQuery(joinRequest: JoinQueryRequest) {
    return this.request('/join', {
      method: 'POST',
      body: JSON.stringify(joinRequest),
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

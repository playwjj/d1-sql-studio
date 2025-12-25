import {
  ApiResponse,
  JoinConfig,
  JoinQueryRequest,
  RowData,
  DatabaseValue,
  TableInfo,
  ColumnInfo,
  IndexInfo,
  IndexColumn,
  IndexWithColumns
} from '../types';

// Re-export types for convenience
export type {
  ApiResponse,
  JoinConfig,
  JoinQueryRequest,
  RowData,
  DatabaseValue,
  TableInfo,
  ColumnInfo,
  IndexInfo,
  IndexColumn,
  IndexWithColumns
};

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

  async listTables(): Promise<ApiResponse<TableInfo[]>> {
    return this.request<TableInfo[]>('/tables');
  }

  async getTableSchema(tableName: string): Promise<ApiResponse<ColumnInfo[]>> {
    return this.request<ColumnInfo[]>(`/tables/${tableName}/schema`);
  }

  async getTableData(
    tableName: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc',
    search?: string,
    sort?: string  // Multi-field sort parameter, format: 'name:asc,created_at:desc'
  ): Promise<ApiResponse<RowData[]>> {
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
    return this.request<RowData[]>(url);
  }

  async executeQuery(sql: string, params?: DatabaseValue[]): Promise<ApiResponse> {
    return this.request('/query', {
      method: 'POST',
      body: JSON.stringify({ sql, params }),
    });
  }

  async joinQuery(joinRequest: JoinQueryRequest): Promise<ApiResponse<RowData[]>> {
    return this.request<RowData[]>('/join', {
      method: 'POST',
      body: JSON.stringify(joinRequest),
    });
  }

  async createTable(sql: string): Promise<ApiResponse> {
    return this.request('/tables', {
      method: 'POST',
      body: JSON.stringify({ sql }),
    });
  }

  async deleteTable(tableName: string): Promise<ApiResponse> {
    return this.request(`/tables/${tableName}`, {
      method: 'DELETE',
    });
  }

  async insertRow(tableName: string, data: RowData): Promise<ApiResponse> {
    return this.request(`/tables/${tableName}/rows`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRow(tableName: string, id: string, data: RowData): Promise<ApiResponse> {
    return this.request(`/tables/${tableName}/rows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRow(tableName: string, id: string): Promise<ApiResponse> {
    return this.request(`/tables/${tableName}/rows/${id}`, {
      method: 'DELETE',
    });
  }

  async addColumn(
    tableName: string,
    columnName: string,
    columnType: string,
    constraints?: string
  ): Promise<ApiResponse> {
    return this.request(`/tables/${tableName}/columns`, {
      method: 'POST',
      body: JSON.stringify({ columnName, columnType, constraints }),
    });
  }

  async dropColumn(tableName: string, columnName: string): Promise<ApiResponse> {
    return this.request(`/tables/${tableName}/columns/${columnName}`, {
      method: 'DELETE',
    });
  }

  async renameColumn(
    tableName: string,
    oldColumnName: string,
    newColumnName: string
  ): Promise<ApiResponse> {
    return this.request(`/tables/${tableName}/columns/${oldColumnName}`, {
      method: 'PUT',
      body: JSON.stringify({ newColumnName }),
    });
  }

  async renameTable(oldTableName: string, newTableName: string): Promise<ApiResponse> {
    return this.request(`/tables/${oldTableName}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ newTableName }),
    });
  }

  // Index management methods
  async listIndexes(tableName: string): Promise<ApiResponse<IndexInfo[]>> {
    return this.request<IndexInfo[]>(`/tables/${tableName}/indexes`);
  }

  async getIndexColumns(tableName: string, indexName: string): Promise<ApiResponse<IndexColumn[]>> {
    return this.request<IndexColumn[]>(`/tables/${tableName}/indexes/${indexName}/columns`);
  }

  async createIndex(
    tableName: string,
    indexName: string,
    columns: string[],
    unique: boolean = false
  ): Promise<ApiResponse> {
    return this.request(`/tables/${tableName}/indexes`, {
      method: 'POST',
      body: JSON.stringify({ indexName, columns, unique }),
    });
  }

  async dropIndex(tableName: string, indexName: string): Promise<ApiResponse> {
    return this.request(`/tables/${tableName}/indexes/${indexName}`, {
      method: 'DELETE',
    });
  }
}

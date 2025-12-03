export interface Env {
  DB: D1Database;
  API_KEY?: string; // Optional: defaults to 'dev-api-key-change-in-production' if not set
  API_KEYS?: KVNamespace; // For storing multiple API keys
  __STATIC_CONTENT: KVNamespace; // For Workers Sites
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface TableInfo {
  name: string;
  type: string;
}

export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export interface QueryRequest {
  sql: string;
  params?: any[];
}

export interface ApiKeyData {
  key: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface Env {
  DB: D1Database;
  API_KEY?: string; // Optional: defaults to 'dev-api-key-change-in-production' if not set
  API_KEYS?: KVNamespace; // For storing multiple API keys
  ASSETS: Fetcher; // For Workers Assets
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
  description?: string;
  createdAt: string;
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

export interface IndexInfo {
  seq: number;       // Sequence number within index
  name: string;      // Index name
  unique: number;    // 1 if UNIQUE, 0 otherwise
  origin: string;    // 'c' = CREATE INDEX, 'u' = UNIQUE constraint, 'pk' = PRIMARY KEY
  partial: number;   // 1 if partial index, 0 otherwise
}

export interface IndexColumn {
  seqno: number;     // Column sequence in index
  cid: number;       // Column ID in table
  name: string;      // Column name
}

export interface CreateIndexRequest {
  indexName: string;
  columns: string[]; // Column names to index
  unique?: boolean;  // Whether to create UNIQUE index
}

/**
 * Shared TypeScript type definitions for D1 SQL Studio
 */

// ============================================================================
// Database Types
// ============================================================================

/**
 * Represents a database column definition
 */
export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | number | null;
  pk: number;
}

/**
 * Represents a database table
 */
export interface TableInfo {
  name: string;
  type?: string;
  sql?: string;
}

/**
 * Represents a database index
 */
export interface IndexInfo {
  seq: number;
  name: string;
  unique: number;
  origin: string;
  partial: number;
}

/**
 * Index column information
 */
export interface IndexColumn {
  seqno: number;
  cid: number;
  name: string;
}

/**
 * Index with its columns
 */
export interface IndexWithColumns extends IndexInfo {
  columns?: IndexColumn[];
}

/**
 * Row data type - represents a single database row
 * Keys are column names, values can be any valid database value
 */
export type RowData = Record<string, DatabaseValue>;

/**
 * Valid database value types
 */
export type DatabaseValue = string | number | boolean | null | undefined;

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: ResponseMeta;
}

/**
 * Metadata included in API responses
 */
export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  duration?: string;
  changes?: number;
  last_row_id?: number | string;
}

/**
 * Query execution result
 */
export interface QueryResult {
  results: RowData[];
  meta?: ResponseMeta;
}

/**
 * Table data response
 */
export interface TableDataResponse {
  data: RowData[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

// ============================================================================
// Query Types
// ============================================================================

/**
 * JOIN configuration for multi-table queries
 */
export interface JoinConfig {
  table: string;
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'CROSS';
  on?: string;
}

/**
 * JOIN query request parameters
 */
export interface JoinQueryRequest {
  baseTable: string;
  joins: JoinConfig[];
  select?: string[];
  where?: string;
  groupBy?: string[];
  having?: string;
  orderBy?: string;
  limit?: number;
  offset?: number;
  params?: DatabaseValue[];
}

/**
 * Sort configuration
 */
export interface SortConfig {
  column: string;
  order: 'asc' | 'desc';
}

// ============================================================================
// Form & Validation Types
// ============================================================================

/**
 * Form field definition
 */
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  defaultValue?: DatabaseValue;
  options?: Array<{ label: string; value: string | number }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: DatabaseValue) => string | null;
  };
}

/**
 * Form validation errors
 */
export type ValidationErrors = Record<string, string>;

// ============================================================================
// UI Component Types
// ============================================================================

/**
 * Modal sizes
 */
export type ModalSize = 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Alert/Toast variants
 */
export type AlertVariant = 'success' | 'danger' | 'warning' | 'info';

/**
 * Button variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning';

/**
 * Notification message
 */
export interface ToastMessage {
  message: string;
  variant: AlertVariant;
  duration?: number;
}

/**
 * Confirmation dialog options
 */
export interface ConfirmOptions {
  title: string;
  message: string;
  variant?: AlertVariant;
  confirmText?: string;
  cancelText?: string;
}

// ============================================================================
// Export Types
// ============================================================================

/**
 * Export format types
 */
export type ExportFormat = 'csv' | 'json' | 'sql';

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  tableName?: string;
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Generic cache entry
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Schema cache entry
 */
export type SchemaCache = CacheEntry<ColumnInfo[]>;

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make specified keys optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specified keys required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Async function type
 */
export type AsyncFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> = (
  ...args: TArgs
) => Promise<TReturn>;

/**
 * Event handler type
 */
export type EventHandler<T = Event> = (event: T) => void;

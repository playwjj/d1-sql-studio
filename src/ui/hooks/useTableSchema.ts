import { useState, useEffect, useCallback } from 'preact/hooks';
import { ApiClient } from '../lib/api';
import { ColumnInfo, CacheEntry } from '../types';

type SchemaCache = CacheEntry<ColumnInfo[]>;

// Global cache shared across all components
const schemaCache = new Map<string, SchemaCache>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Custom hook for fetching and caching table schemas
 * Reduces duplicate schema requests across components
 *
 * @param apiClient - API client instance
 * @param tableName - Name of the table
 * @param options - Configuration options
 * @returns Schema data, loading state, error, and invalidate function
 */
export function useTableSchema(
  apiClient: ApiClient,
  tableName: string,
  options: { skip?: boolean; ttl?: number } = {}
) {
  const { skip = false, ttl = CACHE_TTL } = options;
  const [schema, setSchema] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string>('');

  const loadSchema = useCallback(async (forceRefresh = false) => {
    if (!tableName || skip) return;

    const cacheKey = tableName;
    const now = Date.now();
    const cached = schemaCache.get(cacheKey);

    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && cached && (now - cached.timestamp) < ttl) {
      setSchema(cached.data);
      setLoading(false);
      return cached.data;
    }

    // Fetch fresh data
    setLoading(true);
    setError('');

    try {
      const result = await apiClient.getTableSchema(tableName);

      if (result.success && result.data && Array.isArray(result.data)) {
        const schemaData = result.data as ColumnInfo[];

        // Update cache
        schemaCache.set(cacheKey, {
          data: schemaData,
          timestamp: now
        });

        setSchema(schemaData);
        setLoading(false);
        return schemaData;
      } else {
        throw new Error(result.error || 'Failed to load schema');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load table schema';
      setError(errorMsg);
      setLoading(false);
      throw err;
    }
  }, [apiClient, tableName, skip, ttl]);

  // Invalidate cache for this table
  const invalidate = useCallback(() => {
    schemaCache.delete(tableName);
    return loadSchema(true);
  }, [tableName, loadSchema]);

  // Load on mount or when table changes
  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  return {
    schema,
    loading,
    error,
    invalidate,
    refresh: () => loadSchema(true)
  };
}

/**
 * Invalidate schema cache for a specific table
 * Use this after schema-modifying operations (ADD/DROP/RENAME column)
 */
export function invalidateTableSchema(tableName: string) {
  schemaCache.delete(tableName);
}

/**
 * Clear all schema cache
 * Use this sparingly (e.g., on logout)
 */
export function clearSchemaCache() {
  schemaCache.clear();
}

/**
 * Get column names from cached schema synchronously
 * Returns empty array if not cached
 */
export function getCachedColumnNames(tableName: string): string[] {
  const cached = schemaCache.get(tableName);
  if (!cached) return [];

  const now = Date.now();
  if ((now - cached.timestamp) >= CACHE_TTL) {
    return [];
  }

  return cached.data.map(col => col.name);
}

import { ref, watch } from 'vue';
import type { ApiClient } from '@/lib/api';
import type { ColumnInfo } from '@/types';

const schemaCache = new Map<string, { data: ColumnInfo[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useTableSchema(client: ApiClient, tableName: string) {
  const schema = ref<ColumnInfo[]>([]);
  const loading = ref(false);
  const error = ref('');

  async function loadSchema(name: string) {
    if (!name) return;
    const cached = schemaCache.get(name);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      schema.value = cached.data;
      return;
    }
    loading.value = true;
    error.value = '';
    try {
      const res = await client.getTableSchema(name);
      if (res.success && res.data) {
        schema.value = res.data;
        schemaCache.set(name, { data: res.data, timestamp: Date.now() });
      } else {
        error.value = res.error ?? 'Failed to load schema';
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load schema';
    } finally {
      loading.value = false;
    }
  }

  function invalidate(name: string) {
    schemaCache.delete(name);
    return loadSchema(name);
  }

  watch(() => tableName, loadSchema, { immediate: true });

  return { schema, loading, error, invalidate };
}

export function clearSchemaCache() {
  schemaCache.clear();
}

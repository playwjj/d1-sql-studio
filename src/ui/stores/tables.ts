import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ApiClient } from '@/lib/api';
import type { TableInfo } from '@/types';

export const useTablesStore = defineStore('tables', () => {
  const tableList = ref<TableInfo[]>([]);
  const selectedTable = ref('');
  const refreshKey = ref(0);
  const loading = ref(false);
  const error = ref('');

  async function loadTables(client: ApiClient) {
    loading.value = true;
    error.value = '';
    try {
      const res = await client.listTables();
      if (res.success && res.data) {
        tableList.value = res.data;
      } else {
        error.value = res.error ?? 'Failed to load tables';
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load tables';
    } finally {
      loading.value = false;
    }
  }

  function selectTable(name: string) {
    selectedTable.value = name;
  }

  function triggerRefresh() {
    refreshKey.value++;
  }

  return { tableList, selectedTable, refreshKey, loading, error, loadTables, selectTable, triggerRefresh };
});

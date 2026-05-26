<template>
  <div class="query-view">
    <div class="query-toolbar">
      <NSpace align="center">
        <NButton type="primary" :loading="loading" @click="executeQuery">
          <template #icon><Play :size="14" /></template>
          Run (Ctrl+Enter)
        </NButton>
        <NButton secondary @click="formatSQL">
          <template #icon><AlignLeft :size="14" /></template>
          Format
        </NButton>
        <NButton secondary @click="showHistory = true">
          <template #icon><History :size="14" /></template>
          History
        </NButton>
        <NButton secondary @click="showShortcuts = true">
          <template #icon><Keyboard :size="14" /></template>
        </NButton>
        <NText v-if="execTime" depth="3" style="font-size: 12px">
          {{ execTime }}
        </NText>
      </NSpace>
      <NSpace v-if="result && result.results && result.results.length > 0">
        <NDropdown :options="exportOptions" @select="handleExport">
          <NButton size="small" secondary>
            <template #icon><Download :size="13" /></template>
            Export
          </NButton>
        </NDropdown>
      </NSpace>
    </div>

    <div class="editor-wrapper">
      <SqlEditor
        v-model="sql"
        :tables="tablesStore.tableList.map(t => t.name)"
        @execute="executeQuery"
      />
    </div>

    <div class="results-wrapper">
      <NAlert v-if="queryError" type="error" :title="queryError" style="margin: 12px 16px" />
      <ResultsTable v-else-if="result" :result="result" />
      <NEmpty
        v-else
        description="Run a query to see results"
        style="margin: 40px auto"
      >
        <template #icon><Code2 :size="40" /></template>
      </NEmpty>
    </div>

    <QueryHistory
      v-model:show="showHistory"
      @use="loadFromHistory"
    />
    <KeyboardShortcuts v-model:show="showShortcuts" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  NSpace, NButton, NText, NAlert, NEmpty, NDropdown,
  type DropdownOption,
} from 'naive-ui';
import { Play, AlignLeft, History, Keyboard, Download, Code2 } from '@lucide/vue';
import { format as formatSQLQuery } from 'sql-formatter';
import { useAuthStore } from '@/stores/auth';
import { useTablesStore } from '@/stores/tables';
import { useNotificationStore } from '@/stores/notification';
import { QueryHistoryManager } from '@/lib/queryHistory';
import { useExport } from '@/composables/useExport';
import type { QueryResult } from '@/types';
import SqlEditor from '@/components/query-editor/SqlEditor.vue';
import ResultsTable from '@/components/query-editor/ResultsTable.vue';
import QueryHistory from '@/components/query-editor/QueryHistory.vue';
import KeyboardShortcuts from '@/components/query-editor/KeyboardShortcuts.vue';

const authStore = useAuthStore();
const tablesStore = useTablesStore();
const notif = useNotificationStore();
const { handleExportCSV, handleExportJSON, handleCopySQLInserts } = useExport();

const sql = ref('SELECT * FROM sqlite_master WHERE type = \'table\';');
const result = ref<QueryResult | null>(null);
const queryError = ref('');
const loading = ref(false);
const execTime = ref('');
const showHistory = ref(false);
const showShortcuts = ref(false);

const exportOptions: DropdownOption[] = [
  { label: 'Export as CSV', key: 'csv' },
  { label: 'Export as JSON', key: 'json' },
  { label: 'Copy as SQL INSERT', key: 'sql' },
];

async function executeQuery() {
  const query = sql.value.trim();
  if (!query) return;
  loading.value = true;
  queryError.value = '';
  result.value = null;
  const start = Date.now();
  try {
    const res = await authStore.apiClient.executeQuery(query);
    const duration = `${Date.now() - start}ms`;
    execTime.value = duration;
    if (res.success !== false) {
      result.value = { results: res.data as Record<string, unknown>[] ?? [], meta: res.meta };
      const rows = result.value.results?.length ?? 0;
      QueryHistoryManager.saveQuery(query, true, rows, duration);
      notif.showToast({ message: `Query executed · ${rows} row${rows !== 1 ? 's' : ''} · ${duration}`, type: 'success' });
    } else {
      queryError.value = res.error ?? 'Query failed';
      QueryHistoryManager.saveQuery(query, false, undefined, duration, res.error);
      notif.showToast({ message: res.error ?? 'Query failed', type: 'error' });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Query failed';
    queryError.value = msg;
    QueryHistoryManager.saveQuery(query, false, undefined, undefined, msg);
    notif.showToast({ message: msg, type: 'error' });
  } finally {
    loading.value = false;
  }
}

function formatSQL() {
  try {
    sql.value = formatSQLQuery(sql.value, { language: 'sql', tabWidth: 2, keywordCase: 'upper' });
  } catch {
    notif.showToast({ message: 'Could not format SQL', type: 'warning' });
  }
}

function loadFromHistory(query: string) {
  sql.value = query;
  showHistory.value = false;
}

async function handleExport(key: string) {
  if (!result.value?.results?.length) return;
  if (key === 'csv') handleExportCSV(result.value.results, 'query_results.csv');
  else if (key === 'json') handleExportJSON(result.value.results, 'query_results.json');
  else if (key === 'sql') await handleCopySQLInserts(result.value.results, 'query_results');
}

onMounted(() => {
  tablesStore.loadTables(authStore.apiClient);
});
</script>

<style scoped>
.query-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.query-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.editor-wrapper {
  flex: 0 0 300px;
  border-bottom: 1px solid #f0f0f0;
  overflow: hidden;
}

.results-wrapper {
  flex: 1;
  overflow: auto;
}
</style>

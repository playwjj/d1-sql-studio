<template>
  <div class="view-container">
    <NEmpty v-if="!tablesStore.selectedTable" description="Select a table from the sidebar">
      <template #icon><Search :size="40" /></template>
    </NEmpty>

    <template v-else>
      <div class="view-header">
        <div class="view-title">
          <Search :size="18" />
          <h2>{{ tablesStore.selectedTable }}</h2>
          <NTag type="default" size="small">Data Browser</NTag>
        </div>
        <NSpace>
          <NInput
            v-model:value="searchInput"
            placeholder="Search..."
            clearable
            size="small"
            style="width: 200px"
            @keydown.enter="doSearch"
            @clear="clearSearch"
            @update:value="onSearchInput"
          >
            <template #prefix><Search :size="13" /></template>
          </NInput>
          <NDropdown :options="exportOptions" @select="handleExport">
            <NButton size="small" secondary>
              <template #icon><Download :size="13" /></template>
              Export
            </NButton>
          </NDropdown>
          <NButton type="primary" size="small" @click="showAddModal = true">
            <template #icon><Plus :size="13" /></template>
            Add Row
          </NButton>
        </NSpace>
      </div>

      <NSpin :show="loading">
        <NAlert v-if="error" type="error" :title="error" style="margin-bottom: 12px" />
        <NDataTable
          class="data-table"
          :columns="tableColumns"
          :data="data"
          :pagination="false"
          :bordered="true"
          :single-line="false"
          size="small"
          :scroll-x="scrollX"
          :max-height="'calc(100vh - 240px)'"
          @update:sorter="handleSort"
        />
      </NSpin>

      <div class="table-footer">
        <NText depth="3" style="font-size: 12px">{{ rangeText }}</NText>
        <NPagination
          v-model:page="page"
          :page-count="pageCount"
          :page-size="PAGE_LIMIT"
          size="small"
          :page-slot="5"
          show-quick-jumper
        />
      </div>

      <!-- API Documentation -->
      <NCollapse style="margin-top: 16px">
        <NCollapseItem title="REST API Documentation" name="api-docs">
          <ApiDocumentation :table-name="tablesStore.selectedTable" />
        </NCollapseItem>
      </NCollapse>
    </template>

    <AddRowModal
      v-if="tablesStore.selectedTable"
      v-model:show="showAddModal"
      :table-name="tablesStore.selectedTable"
      @success="loadData"
    />
    <EditRowModal
      v-if="editingRow"
      v-model:show="showEditModal"
      :table-name="tablesStore.selectedTable"
      :row-data="editingRow"
      @success="loadData"
    />

    <NModal v-model:show="showExpandModal" preset="card" :title="expandedCell?.col" style="max-width: 640px; width: 90vw">
      <NScrollbar style="max-height: 60vh">
        <pre class="expanded-cell-content">{{ expandedCell?.value }}</pre>
      </NScrollbar>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, h } from 'vue';
import {
  NEmpty, NSpace, NInput, NButton, NDropdown, NDataTable, NTooltip,
  NSpin, NAlert, NText, NPagination, NTag, NCollapse, NCollapseItem, NModal, NScrollbar,
  type DataTableColumns, type DropdownOption,
} from 'naive-ui';
import { Search, Download, Plus, Pencil, Trash2 } from '@lucide/vue';
import { useAuthStore } from '@/stores/auth';
import { useTablesStore } from '@/stores/tables';
import { useNotificationStore } from '@/stores/notification';
import { DEFAULT_PAGE_LIMIT } from '@/config/constants';
import { useExport } from '@/composables/useExport';
import { useTableSchema } from '@/composables/useTableSchema';
import type { RowData } from '@/types';
import NullValue from '@/components/shared/NullValue.vue';
import AddRowModal from '@/components/data-browser/AddRowModal.vue';
import EditRowModal from '@/components/data-browser/EditRowModal.vue';
import ApiDocumentation from '@/components/data-browser/ApiDocumentation.vue';

const PAGE_LIMIT = DEFAULT_PAGE_LIMIT;

const authStore = useAuthStore();
const tablesStore = useTablesStore();
const notif = useNotificationStore();
const { handleExportCSV, handleExportJSON, handleCopySQLInserts } = useExport();

const data = ref<RowData[]>([]);
const total = ref(0);
const loading = ref(false);
const error = ref('');
const page = ref(1);
const searchInput = ref('');
const search = ref('');
const sortBy = ref('');
const sortOrder = ref<'asc' | 'desc'>('asc');
const showAddModal = ref(false);
const showEditModal = ref(false);
const editingRow = ref<RowData | null>(null);
const showExpandModal = ref(false);
const expandedCell = ref<{ col: string; value: string } | null>(null);

const { schema } = useTableSchema(authStore.apiClient, () => tablesStore.selectedTable ?? '');
const schemaTypeMap = computed(() => new Map(schema.value.map(c => [c.name, c.type.toUpperCase().split('(')[0]])));

const pageCount = computed(() => Math.ceil(total.value / PAGE_LIMIT) || 1);

const rangeText = computed(() => {
  if (total.value === 0) return '0 rows';
  const start = (page.value - 1) * PAGE_LIMIT + 1;
  const end = Math.min(page.value * PAGE_LIMIT, total.value);
  return `${start}–${end} of ${total.value} rows`;
});

function colWidth(col: string): number {
  return Math.max(100, Math.min(col.length * 9 + 48, 280));
}

function copyCell(val: string, e: MouseEvent) {
  e.stopPropagation();
  navigator.clipboard?.writeText(val)
    .then(() => notif.showToast({ message: 'Copied', type: 'success' }))
    .catch(() => notif.showToast({ message: 'Copy failed', type: 'warning' }));
}

function expandCell(col: string, val: string, e: MouseEvent) {
  e.stopPropagation();
  expandedCell.value = { col, value: val };
  showExpandModal.value = true;
}

const scrollX = computed(() => {
  if (data.value.length === 0) return 600;
  return Math.max(600, Object.keys(data.value[0]).reduce((sum, col) => sum + colWidth(col), 0) + 110);
});

const tableColumns = computed<DataTableColumns<RowData>>(() => {
  const currentSortBy = sortBy.value;
  const currentSortOrder = sortOrder.value;
  if (data.value.length === 0) return [];
  const typeMap = schemaTypeMap.value;
  const cols: DataTableColumns<RowData> = Object.keys(data.value[0]).map(col => ({
    title: () => h('div', { class: 'col-header' }, [
      h('span', { class: 'col-title' }, col),
      typeMap.get(col) ? h('span', { class: 'col-type' }, typeMap.get(col)) : null,
    ]),
    key: col,
    width: colWidth(col),
    sorter: true,
    sortOrder: currentSortBy === col
      ? (currentSortOrder === 'asc' ? 'ascend' : 'descend')
      : false,
    render: (row: RowData) => {
      const val = row[col];
      if (val === null || val === undefined) return h(NullValue);
      const str = String(val);
      if (str.length > 200) {
        return h('span', {
          class: 'cell-text cell-long',
          title: 'Click to copy · Double-click to expand',
          onClick: (e: MouseEvent) => copyCell(str, e),
          onDblclick: (e: MouseEvent) => expandCell(col, str, e),
        }, str);
      }
      return h(NTooltip, { trigger: 'hover', placement: 'top-start', keepAliveOnHover: false }, {
        trigger: () => h('span', {
          class: 'cell-text',
          onClick: (e: MouseEvent) => copyCell(str, e),
        }, str),
        default: () => h('span', { style: 'white-space: pre-wrap; word-break: break-all' }, str),
      });
    },
  }));
  cols.push({
    title: '',
    key: '__actions',
    width: 110,
    fixed: 'right',
    align: 'right',
    render: (row: RowData) =>
      h('div', { class: 'actions-cell' }, [
        h(NTooltip, { trigger: 'hover' }, {
          trigger: () => h(NButton, {
            size: 'small', secondary: true,
            onClick: () => handleEdit(row),
          }, { icon: () => h(Pencil, { size: 13 }) }),
          default: () => 'Edit row',
        }),
        h(NTooltip, { trigger: 'hover' }, {
          trigger: () => h(NButton, {
            size: 'small', type: 'error', ghost: true,
            onClick: () => handleDelete(row),
          }, { icon: () => h(Trash2, { size: 13 }) }),
          default: () => 'Delete row',
        }),
      ]),
  });
  return cols;
});

function handleSort(sortState: { columnKey: string | number; order: 'ascend' | 'descend' | false } | null) {
  if (!sortState || sortState.order === false) {
    sortBy.value = '';
    sortOrder.value = 'asc';
  } else {
    sortBy.value = String(sortState.columnKey);
    sortOrder.value = sortState.order === 'ascend' ? 'asc' : 'desc';
  }
}

const exportOptions: DropdownOption[] = [
  { label: 'Export as CSV', key: 'csv' },
  { label: 'Export as JSON', key: 'json' },
  { label: 'Copy as SQL INSERT', key: 'sql' },
];

async function loadData() {
  if (!tablesStore.selectedTable) return;
  loading.value = true;
  error.value = '';
  try {
    const res = await authStore.apiClient.getTableData(
      tablesStore.selectedTable, page.value, PAGE_LIMIT,
      sortBy.value || undefined, sortOrder.value, search.value || undefined,
    );
    if (res.success && res.data) {
      data.value = Array.isArray(res.data) ? res.data : (res.data as { data: RowData[] }).data ?? [];
      total.value = res.meta?.total ?? data.value.length;
    } else {
      error.value = res.error ?? 'Failed to load data';
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load data';
  } finally {
    loading.value = false;
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;

function onSearchInput(val: string) {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { search.value = val; page.value = 1; }, 300);
}

function doSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  search.value = searchInput.value;
  page.value = 1;
}

function clearSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  search.value = '';
  searchInput.value = '';
  page.value = 1;
}

onUnmounted(() => { if (searchTimer) clearTimeout(searchTimer); });

function handleEdit(row: RowData) {
  editingRow.value = { ...row };
  showEditModal.value = true;
}

async function handleDelete(row: RowData) {
  const keys = Object.keys(row);
  const pkCol = keys[0];
  const pkVal = row[pkCol];
  const ok = await notif.showConfirm({
    content: `Delete row where ${pkCol} = ${pkVal}?`,
    type: 'warning',
    positiveText: 'Delete',
  });
  if (!ok) return;
  try {
    const res = await authStore.apiClient.deleteRow(tablesStore.selectedTable, String(pkVal));
    if (res.success !== false) {
      notif.showToast({ message: 'Row deleted', type: 'success' });
      await loadData();
    } else {
      notif.showToast({ message: res.error ?? 'Delete failed', type: 'error' });
    }
  } catch {
    notif.showToast({ message: 'Delete failed', type: 'error' });
  }
}

async function handleExport(key: string) {
  const tableName = tablesStore.selectedTable;
  if (key === 'csv') handleExportCSV(data.value, `${tableName}_export.csv`);
  else if (key === 'json') handleExportJSON(data.value, `${tableName}_export.json`);
  else if (key === 'sql') await handleCopySQLInserts(data.value, tableName);
}

watch(() => tablesStore.selectedTable, () => {
  page.value = 1;
  search.value = '';
  searchInput.value = '';
  loadData();
});

watch(page, loadData);
watch([search, sortBy, sortOrder], () => { page.value = 1; loadData(); });

onMounted(loadData);
</script>

<style scoped>
.view-container {
  padding: 24px;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.view-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-title h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 0 2px;
}

:deep(.col-header) {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

:deep(.col-title) {
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 12px;
  font-weight: 600;
  color: #4a5068;
}

:deep(.col-type) {
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 10px;
  font-weight: 400;
  color: #bbb;
  letter-spacing: 0.2px;
}

:deep(.actions-cell) {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  white-space: nowrap;
}

:deep(.data-table .n-data-table-td) {
  padding-top: 8px;
  padding-bottom: 8px;
}

:deep(.cell-text) {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  cursor: pointer;
}

:deep(.cell-long) {
  color: #8890a6;
  font-style: italic;
}

.expanded-cell-content {
  margin: 0;
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.6;
}
</style>

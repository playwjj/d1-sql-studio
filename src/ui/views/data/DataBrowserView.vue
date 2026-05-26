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
          <NInputGroup>
            <NInput
              v-model:value="searchInput"
              placeholder="Search..."
              clearable
              size="small"
              @keydown.enter="doSearch"
              @clear="clearSearch"
            />
            <NButton size="small" @click="doSearch">Search</NButton>
          </NInputGroup>
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
          :columns="tableColumns"
          :data="data"
          :pagination="false"
          :bordered="true"
          size="small"
          :scroll-x="scrollX"
          :max-height="'calc(100vh - 240px)'"
          virtual-scroll
        />
      </NSpin>

      <div class="table-footer">
        <NText depth="3" style="font-size: 12px">{{ total }} rows total</NText>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, h } from 'vue';
import {
  NEmpty, NSpace, NInput, NInputGroup, NButton, NDropdown, NDataTable,
  NSpin, NAlert, NText, NPagination, NTag, NCollapse, NCollapseItem,
  type DataTableColumns, type DropdownOption,
} from 'naive-ui';
import { Search, Download, Plus, Pencil, Trash2 } from '@lucide/vue';
import { useAuthStore } from '@/stores/auth';
import { useTablesStore } from '@/stores/tables';
import { useNotificationStore } from '@/stores/notification';
import { DEFAULT_PAGE_LIMIT } from '@/config/constants';
import { useExport } from '@/composables/useExport';
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

const pageCount = computed(() => Math.ceil(total.value / PAGE_LIMIT) || 1);
const scrollX = computed(() => Math.max(600, data.value.length > 0 ? Object.keys(data.value[0]).length * 140 : 600));

const tableColumns = computed<DataTableColumns<RowData>>(() => {
  if (data.value.length === 0) return [];
  const cols: DataTableColumns<RowData> = Object.keys(data.value[0]).map(col => ({
    title: col,
    key: col,
    width: 140,
    ellipsis: { tooltip: true },
    sorter: true,
    render: (row: RowData) => row[col] === null || row[col] === undefined
      ? h(NullValue)
      : String(row[col]),
  }));
  cols.push({
    title: 'Actions',
    key: '__actions',
    width: 100,
    fixed: 'right',
    render: (row: RowData) => h(NSpace, { size: 'small' }, {
      default: () => [
        h(NButton, { size: 'tiny', onClick: () => handleEdit(row) }, { icon: () => h(Pencil, { size: 12 }) }),
        h(NButton, { size: 'tiny', type: 'error', onClick: () => handleDelete(row) }, { icon: () => h(Trash2, { size: 12 }) }),
      ],
    }),
  });
  return cols;
});

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

function doSearch() {
  search.value = searchInput.value;
  page.value = 1;
}

function clearSearch() {
  search.value = '';
  searchInput.value = '';
  page.value = 1;
}

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
</style>

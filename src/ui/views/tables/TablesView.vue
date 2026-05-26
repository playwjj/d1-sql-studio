<template>
  <div class="view-container">
    <div class="view-header">
      <div class="view-title">
        <Table2 :size="18" />
        <h2>Tables</h2>
        <NText depth="3" style="font-size: 13px; font-weight: 400">
          {{ tablesStore.tableList.length }} tables
        </NText>
      </div>
      <NSpace>
        <NButton secondary @click="showVisualBuilder = true">
          <template #icon><Wand2 :size="14" /></template>
          Visual Builder
        </NButton>
        <NButton type="primary" @click="showCreateModal = true">
          <template #icon><Plus :size="14" /></template>
          New Table
        </NButton>
      </NSpace>
    </div>

    <NSpin :show="loading">
      <NAlert v-if="dbNotBound" type="warning" title="Database not bound" style="margin-bottom: 16px">
        Bind a D1 database to your Worker with binding name <NText code>DB</NText>.
      </NAlert>

      <NAlert v-else-if="error && !dbNotBound" type="error" :title="error" style="margin-bottom: 16px" />

      <template v-else>
        <NDataTable
          :columns="columns"
          :data="tablesStore.tableList"
          :pagination="false"
          :bordered="false"
          :single-line="false"
          size="small"
          class="tables-table"
        />
        <NEmpty
          v-if="!loading && tablesStore.tableList.length === 0"
          description="No tables yet — create one to get started"
          style="margin: 48px auto"
        >
          <template #icon><Table2 :size="40" /></template>
        </NEmpty>
      </template>
    </NSpin>

    <CreateTableModal v-model:show="showCreateModal" @success="onSuccess" />
    <VisualTableBuilder v-model:show="showVisualBuilder" @success="onSuccess" />
    <EditTableModal
      v-if="editingTable"
      v-model:show="showEditModal"
      :table-name="editingTable"
      @success="onSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, h, onMounted } from 'vue';
import {
  NDataTable, NButton, NSpace, NSpin, NAlert, NText, NEmpty, NTooltip,
  type DataTableColumns,
} from 'naive-ui';
import { Table2, Plus, Wand2, Search, Pencil, Trash2 } from '@lucide/vue';
import { useAuthStore } from '@/stores/auth';
import { useTablesStore } from '@/stores/tables';
import { useNotificationStore } from '@/stores/notification';
import type { TableInfo } from '@/types';
import CreateTableModal from '@/components/tables/CreateTableModal.vue';
import VisualTableBuilder from '@/components/tables/VisualTableBuilder.vue';
import EditTableModal from '@/components/tables/EditTableModal.vue';

const authStore = useAuthStore();
const tablesStore = useTablesStore();
const notif = useNotificationStore();

const loading = ref(false);
const error = ref('');
const dbNotBound = ref(false);
const showCreateModal = ref(false);
const showVisualBuilder = ref(false);
const showEditModal = ref(false);
const editingTable = ref('');

const columns: DataTableColumns<TableInfo> = [
  {
    title: 'Name',
    key: 'name',
    sorter: 'default',
    render: (row) =>
      h('div', { class: 'table-name-cell' }, [
        h(Table2, { size: 14, class: 'table-icon' }),
        h('span', { class: 'table-name-text' }, row.name),
      ]),
  },
  {
    title: '',
    key: 'actions',
    width: 190,
    align: 'right',
    render: (row) =>
      h('div', { class: 'actions-cell' }, [
        h(NTooltip, { trigger: 'hover' }, {
          trigger: () => h(NButton, {
            size: 'small',
            type: 'primary',
            ghost: true,
            onClick: () => handleBrowse(row.name),
          }, { icon: () => h(Search, { size: 13 }), default: () => 'Browse' }),
          default: () => 'Open in Data Browser',
        }),
        h(NTooltip, { trigger: 'hover' }, {
          trigger: () => h(NButton, {
            size: 'small',
            secondary: true,
            onClick: () => handleEdit(row.name),
          }, { icon: () => h(Pencil, { size: 13 }) }),
          default: () => 'Edit structure',
        }),
        h(NTooltip, { trigger: 'hover' }, {
          trigger: () => h(NButton, {
            size: 'small',
            type: 'error',
            ghost: true,
            onClick: () => handleDelete(row.name),
          }, { icon: () => h(Trash2, { size: 13 }) }),
          default: () => 'Drop table',
        }),
      ]),
  },
];

async function loadTables() {
  loading.value = true;
  error.value = '';
  dbNotBound.value = false;
  try {
    const res = await authStore.apiClient.listTables();
    if (res.success && res.data) {
      tablesStore.tableList = res.data;
    } else if (res.error?.includes('DATABASE_NOT_BOUND')) {
      dbNotBound.value = true;
    } else {
      error.value = res.error ?? 'Failed to load tables';
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load tables';
  } finally {
    loading.value = false;
  }
}

function handleBrowse(name: string) {
  tablesStore.selectTable(name);
  import('@/router').then(m => m.default.push({ name: 'data' }));
}

function handleEdit(name: string) {
  editingTable.value = name;
  showEditModal.value = true;
}

async function handleDelete(name: string) {
  const ok = await notif.showConfirm({
    title: `Drop table "${name}"?`,
    content: 'This will permanently delete the table and all its data. This cannot be undone.',
    type: 'warning',
    positiveText: 'Drop',
  });
  if (!ok) return;
  try {
    const res = await authStore.apiClient.deleteTable(name);
    if (res.success !== false) {
      notif.showToast({ message: `Table "${name}" dropped`, type: 'success' });
      await loadTables();
    } else {
      notif.showToast({ message: res.error ?? 'Failed to drop table', type: 'error' });
    }
  } catch {
    notif.showToast({ message: 'Failed to drop table', type: 'error' });
  }
}

function onSuccess() {
  loadTables();
}

watch(() => tablesStore.refreshKey, () => loadTables());
onMounted(loadTables);
</script>

<style scoped>
.view-container {
  padding: 24px;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
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

/* Table cell styles — pierce Naive UI shadow DOM with :deep() */
:deep(.table-name-cell) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}

:deep(.table-icon) {
  color: #aaa;
  flex-shrink: 0;
}

:deep(.table-name-text) {
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 13px;
  color: #222;
}

:deep(.actions-cell) {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  white-space: nowrap;
}

/* Compact row height */
:deep(.tables-table .n-data-table-td) {
  padding-top: 8px;
  padding-bottom: 8px;
}
</style>

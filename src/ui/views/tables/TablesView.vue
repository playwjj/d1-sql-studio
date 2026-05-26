<template>
  <div class="view-container">
    <div class="view-header">
      <div class="view-title">
        <Table2 :size="18" />
        <h2>Tables</h2>
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

      <NDataTable
        v-else
        :columns="columns"
        :data="tablesStore.tableList"
        :pagination="false"
        :bordered="false"
        size="small"
        striped
      />
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
import { ref, computed, watch, h, onMounted } from 'vue';
import {
  NDataTable, NButton, NSpace, NSpin, NAlert, NText,
  type DataTableColumns,
} from 'naive-ui';
import { Table2, Plus, Wand2, Pencil, Trash2 } from '@lucide/vue';
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

const columns = computed<DataTableColumns<TableInfo>>(() => [
  { title: 'Name', key: 'name', sorter: 'default' },
  { title: 'Type', key: 'type', width: 100, render: (row) => row.type ?? 'table' },
  {
    title: 'Actions',
    key: 'actions',
    width: 160,
    render: (row) => h(NSpace, { size: 'small' }, {
      default: () => [
        h(NButton, { size: 'small', onClick: () => handleBrowse(row.name) }, { default: () => 'Browse' }),
        h(NButton, { size: 'small', onClick: () => handleEdit(row.name) }, {
          icon: () => h(Pencil, { size: 13 }),
        }),
        h(NButton, { size: 'small', type: 'error', onClick: () => handleDelete(row.name) }, {
          icon: () => h(Trash2, { size: 13 }),
        }),
      ],
    }),
  },
]);

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
  // navigate handled by router in DashboardLayout via store
  import('@/router').then(m => m.default.push({ name: 'data' }));
}

function handleEdit(name: string) {
  editingTable.value = name;
  showEditModal.value = true;
}

async function handleDelete(name: string) {
  const ok = await notif.showConfirm({
    title: `Delete "${name}"?`,
    content: 'This will permanently delete the table and all its data.',
    type: 'warning',
    positiveText: 'Delete',
  });
  if (!ok) return;
  try {
    const res = await authStore.apiClient.deleteTable(name);
    if (res.success !== false) {
      notif.showToast({ message: `Table "${name}" deleted`, type: 'success' });
      await loadTables();
    } else {
      notif.showToast({ message: res.error ?? 'Delete failed', type: 'error' });
    }
  } catch {
    notif.showToast({ message: 'Delete failed', type: 'error' });
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
</style>

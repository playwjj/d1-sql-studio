<template>
  <NModal v-model:show="show" :title="`Edit Table: ${tableName}`" preset="card" style="width: 680px">
    <NTabs v-model:value="activeTab" type="segment" animated>
      <!-- Columns Tab -->
      <NTabPane name="columns" tab="Columns">
        <NSpin :show="schemaLoading">
          <NDataTable
            :columns="columnColumns"
            :data="schema"
            :pagination="false"
            :bordered="false"
            size="small"
            style="margin-bottom: 12px"
          />
        </NSpin>
      </NTabPane>

      <!-- Add Column Tab -->
      <NTabPane name="add" tab="Add Column">
        <NForm ref="addFormRef" :model="addForm" :rules="addRules">
          <NFormItem path="columnName" label="Column Name">
            <NInput v-model:value="addForm.columnName" placeholder="new_column" />
          </NFormItem>
          <NFormItem path="columnType" label="Type">
            <NSelect v-model:value="addForm.columnType" :options="typeOptions" />
          </NFormItem>
          <NFormItem label="Constraints (optional)">
            <NInput v-model:value="addForm.constraints" placeholder="NOT NULL DEFAULT ''" />
          </NFormItem>
          <NButton type="primary" :loading="addLoading" @click="handleAddColumn">Add Column</NButton>
        </NForm>
        <NAlert v-if="addError" type="error" :title="addError" style="margin-top: 12px" />
      </NTabPane>

      <!-- Rename Tab -->
      <NTabPane name="rename" tab="Rename">
        <NForm ref="renameFormRef" :model="renameForm">
          <NText depth="2" style="margin-bottom: 12px; display: block">Rename Table</NText>
          <NFormItem path="newName" label="New Table Name">
            <NInput v-model:value="renameForm.newName" :placeholder="tableName" />
          </NFormItem>
          <NButton type="primary" :loading="renameLoading" @click="handleRenameTable">Rename Table</NButton>
        </NForm>
        <NDivider />
        <NText depth="2" style="margin-bottom: 12px; display: block">Rename Column</NText>
        <NForm :model="renameColForm">
          <NFormItem label="Column">
            <NSelect v-model:value="renameColForm.oldName" :options="columnOptions" />
          </NFormItem>
          <NFormItem label="New Name">
            <NInput v-model:value="renameColForm.newName" placeholder="new_name" />
          </NFormItem>
          <NButton type="primary" :loading="renameColLoading" @click="handleRenameColumn">Rename Column</NButton>
        </NForm>
        <NAlert v-if="renameError" type="error" :title="renameError" style="margin-top: 12px" />
      </NTabPane>

      <!-- Indexes Tab -->
      <NTabPane name="indexes" tab="Indexes">
        <NSpin :show="indexLoading">
          <NDataTable
            :columns="indexColumns"
            :data="indexes"
            :pagination="false"
            :bordered="false"
            size="small"
            style="margin-bottom: 16px"
          />
        </NSpin>

        <!-- Create index -->
        <NDivider>Create Index</NDivider>
        <NForm :model="indexForm">
          <NFormItem label="Index Name">
            <NInput v-model:value="indexForm.name" placeholder="idx_tablename_column" />
          </NFormItem>
          <NFormItem label="Columns">
            <NCheckboxGroup v-model:value="indexForm.columns">
              <NSpace>
                <NCheckbox v-for="col in schema" :key="col.name" :value="col.name" :label="col.name" />
              </NSpace>
            </NCheckboxGroup>
          </NFormItem>
          <NFormItem label="">
            <NCheckbox v-model:checked="indexForm.unique">Unique Index</NCheckbox>
          </NFormItem>
          <NButton type="primary" :loading="createIndexLoading" @click="handleCreateIndex">Create Index</NButton>
        </NForm>
        <NAlert v-if="indexError" type="error" :title="indexError" style="margin-top: 12px" />
      </NTabPane>
    </NTabs>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="show = false">Close</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, h } from 'vue';
import {
  NModal, NTabs, NTabPane, NForm, NFormItem, NInput, NSelect, NButton, NSpace,
  NAlert, NDataTable, NSpin, NDivider, NText, NCheckbox, NCheckboxGroup,
  NTag, type DataTableColumns, type FormRules, type FormInst, type SelectOption,
} from 'naive-ui';
import { Trash2 } from '@lucide/vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { useTableSchema } from '@/composables/useTableSchema';
import type { ColumnInfo, IndexWithColumns } from '@/types';

const props = defineProps<{ tableName: string }>();
const show = defineModel<boolean>('show', { default: false });
const emit = defineEmits<{ success: [] }>();

const authStore = useAuthStore();
const notif = useNotificationStore();
const activeTab = ref('columns');

// Schema
const { schema, loading: schemaLoading } = useTableSchema(authStore.apiClient, props.tableName);

// Column columns
const columnColumns: DataTableColumns<ColumnInfo> = [
  { title: 'Name', key: 'name' },
  { title: 'Type', key: 'type', width: 100 },
  { title: 'PK', key: 'pk', width: 50, render: row => row.pk ? h(NTag, { type: 'info', size: 'small' }, () => 'PK') : '' },
  { title: 'Not Null', key: 'notnull', width: 80, render: row => row.notnull ? '✓' : '' },
  { title: 'Default', key: 'dflt_value', render: row => String(row.dflt_value ?? '') },
  {
    title: '',
    key: 'actions',
    width: 60,
    render: (row) => row.pk ? '' : h(NButton, {
      size: 'small', type: 'error',
      onClick: () => handleDropColumn(row.name),
    }, { icon: () => h(Trash2, { size: 12 }) }),
  },
];

const typeOptions: SelectOption[] = ['INTEGER', 'TEXT', 'REAL', 'BLOB', 'NUMERIC'].map(t => ({ label: t, value: t }));

const columnOptions = computed<SelectOption[]>(() => schema.value.map(c => ({ label: c.name, value: c.name })));

// Add column
const addFormRef = ref<FormInst | null>(null);
const addLoading = ref(false);
const addError = ref('');
const addForm = ref({ columnName: '', columnType: 'TEXT', constraints: '' });
const addRules: FormRules = {
  columnName: [{ required: true, message: 'Column name is required', trigger: 'blur' }],
  columnType: [{ required: true, message: 'Type is required', trigger: 'change' }],
};

async function handleAddColumn() {
  try { await addFormRef.value?.validate(); } catch { return; }
  addLoading.value = true; addError.value = '';
  try {
    const res = await authStore.apiClient.addColumn(props.tableName, addForm.value.columnName, addForm.value.columnType, addForm.value.constraints);
    if (res.success !== false) {
      notif.showToast({ message: 'Column added', type: 'success' });
      addForm.value = { columnName: '', columnType: 'TEXT', constraints: '' };
      emit('success');
    } else { addError.value = res.error ?? 'Failed'; }
  } catch (e) { addError.value = e instanceof Error ? e.message : 'Failed'; }
  finally { addLoading.value = false; }
}

async function handleDropColumn(colName: string) {
  const ok = await notif.showConfirm({ content: `Drop column "${colName}"?`, type: 'warning', positiveText: 'Drop' });
  if (!ok) return;
  try {
    const res = await authStore.apiClient.dropColumn(props.tableName, colName);
    if (res.success !== false) { notif.showToast({ message: 'Column dropped', type: 'success' }); emit('success'); }
    else { notif.showToast({ message: res.error ?? 'Failed', type: 'error' }); }
  } catch { notif.showToast({ message: 'Failed', type: 'error' }); }
}

// Rename
const renameFormRef = ref<FormInst | null>(null);
const renameLoading = ref(false);
const renameColLoading = ref(false);
const renameError = ref('');
const renameForm = ref({ newName: '' });
const renameColForm = ref({ oldName: '', newName: '' });

async function handleRenameTable() {
  if (!renameForm.value.newName.trim()) return;
  renameLoading.value = true;
  try {
    const res = await authStore.apiClient.renameTable(props.tableName, renameForm.value.newName.trim());
    if (res.success !== false) { notif.showToast({ message: 'Table renamed', type: 'success' }); emit('success'); show.value = false; }
    else { renameError.value = res.error ?? 'Failed'; }
  } catch (e) { renameError.value = e instanceof Error ? e.message : 'Failed'; }
  finally { renameLoading.value = false; }
}

async function handleRenameColumn() {
  if (!renameColForm.value.oldName || !renameColForm.value.newName.trim()) return;
  renameColLoading.value = true;
  try {
    const res = await authStore.apiClient.renameColumn(props.tableName, renameColForm.value.oldName, renameColForm.value.newName.trim());
    if (res.success !== false) { notif.showToast({ message: 'Column renamed', type: 'success' }); emit('success'); }
    else { renameError.value = res.error ?? 'Failed'; }
  } catch (e) { renameError.value = e instanceof Error ? e.message : 'Failed'; }
  finally { renameColLoading.value = false; }
}

// Indexes
const indexes = ref<IndexWithColumns[]>([]);
const indexLoading = ref(false);
const createIndexLoading = ref(false);
const indexError = ref('');
const indexForm = ref({ name: '', columns: [] as string[], unique: false });

const indexColumns: DataTableColumns<IndexWithColumns> = [
  { title: 'Name', key: 'name' },
  {
    title: 'Type',
    key: 'origin',
    width: 100,
    render: row => {
      const map: Record<string, string> = { pk: 'PRIMARY KEY', u: 'UNIQUE', c: 'INDEX' };
      return h(NTag, { size: 'small', type: row.origin === 'pk' ? 'info' : row.origin === 'u' ? 'success' : 'default' }, () => map[row.origin] ?? row.origin);
    },
  },
  { title: 'Columns', key: 'columns', render: row => row.columns?.map((c: { name: string }) => c.name).join(', ') ?? '—' },
  {
    title: '',
    key: 'actions',
    width: 60,
    render: row => (row.origin === 'c') ? h(NButton, {
      size: 'small', type: 'error',
      onClick: () => handleDropIndex(row.name),
    }, { icon: () => h(Trash2, { size: 12 }) }) : '',
  },
];

async function loadIndexes() {
  indexLoading.value = true;
  try {
    const res = await authStore.apiClient.listIndexes(props.tableName);
    if (res.success && res.data) {
      const withCols = await Promise.all(res.data.map(async idx => {
        const colRes = await authStore.apiClient.getIndexColumns(props.tableName, idx.name);
        return { ...idx, columns: colRes.data ?? [] };
      }));
      indexes.value = withCols;
    }
  } finally { indexLoading.value = false; }
}

async function handleCreateIndex() {
  if (!indexForm.value.name || indexForm.value.columns.length === 0) {
    indexError.value = 'Index name and at least one column are required';
    return;
  }
  createIndexLoading.value = true; indexError.value = '';
  try {
    const res = await authStore.apiClient.createIndex(props.tableName, indexForm.value.name, indexForm.value.columns, indexForm.value.unique);
    if (res.success !== false) {
      notif.showToast({ message: 'Index created', type: 'success' });
      indexForm.value = { name: '', columns: [], unique: false };
      await loadIndexes();
    } else { indexError.value = res.error ?? 'Failed'; }
  } catch (e) { indexError.value = e instanceof Error ? e.message : 'Failed'; }
  finally { createIndexLoading.value = false; }
}

async function handleDropIndex(name: string) {
  const ok = await notif.showConfirm({ content: `Drop index "${name}"?`, type: 'warning', positiveText: 'Drop' });
  if (!ok) return;
  try {
    const res = await authStore.apiClient.dropIndex(props.tableName, name);
    if (res.success !== false) { notif.showToast({ message: 'Index dropped', type: 'success' }); await loadIndexes(); }
    else { notif.showToast({ message: res.error ?? 'Failed', type: 'error' }); }
  } catch { notif.showToast({ message: 'Failed', type: 'error' }); }
}

watch(activeTab, (tab) => { if (tab === 'indexes') loadIndexes(); });
</script>

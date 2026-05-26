<template>
  <NModal v-model:show="show" title="Visual Table Builder" preset="card" style="width: 820px">
    <div class="vb-layout">
      <!-- Left: Column Editor -->
      <div class="vb-editor">
        <NFormItem label="Table Name" :show-feedback="!!tableNameError" style="margin-bottom: 16px">
          <NInput v-model:value="tableName" placeholder="my_table" @blur="validateTableName" />
          <template #feedback>{{ tableNameError }}</template>
        </NFormItem>

        <div class="vb-section-label">Columns</div>

        <!-- Header row -->
        <div class="col-grid col-header">
          <span class="ch-left">Name</span>
          <span class="ch-left">Type</span>
          <NTooltip trigger="hover"><template #trigger><span class="ch-tag">PK</span></template>Primary Key</NTooltip>
          <NTooltip trigger="hover"><template #trigger><span class="ch-tag">AI</span></template>Auto Increment (INTEGER only)</NTooltip>
          <NTooltip trigger="hover"><template #trigger><span class="ch-tag">NN</span></template>Not Null</NTooltip>
          <NTooltip trigger="hover"><template #trigger><span class="ch-tag">UQ</span></template>Unique</NTooltip>
          <span class="ch-left">Default</span>
          <span></span>
        </div>

        <!-- Field rows -->
        <div v-for="(field, idx) in fields" :key="field.id" class="col-grid col-row">
          <NInput v-model:value="field.name" placeholder="column_name" size="small" />
          <NSelect v-model:value="field.type" :options="typeOptions" size="small" @update:value="(v) => onTypeChange(idx, v)" />
          <div class="check-cell"><NCheckbox v-model:checked="field.isPrimaryKey" @update:checked="(v) => onPKChange(idx, v)" /></div>
          <div class="check-cell"><NCheckbox v-model:checked="field.autoIncrement" :disabled="!field.isPrimaryKey || field.type !== 'INTEGER'" /></div>
          <div class="check-cell"><NCheckbox v-model:checked="field.notNull" /></div>
          <div class="check-cell"><NCheckbox v-model:checked="field.unique" /></div>
          <NInput v-model:value="field.defaultValue" placeholder="—" size="small" />
          <NButton text type="error" size="small" :disabled="fields.length <= 1" @click="removeField(idx)">
            <template #icon><Trash2 :size="12" /></template>
          </NButton>
        </div>

        <NButton dashed block size="small" style="margin-top: 8px" @click="addField">
          <template #icon><Plus :size="13" /></template>
          Add Column
        </NButton>
      </div>

      <!-- Right: SQL Preview -->
      <div class="vb-preview">
        <div class="vb-section-label">SQL Preview</div>
        <NCode :code="generatedSQL" language="sql" style="font-size: 12px; max-height: 380px; overflow: auto" />
      </div>
    </div>

    <NAlert v-if="error" type="error" :title="error" style="margin-top: 12px" />

    <template #footer>
      <NSpace justify="end">
        <NButton @click="show = false">Cancel</NButton>
        <NButton type="primary" :loading="loading" @click="handleCreate">Create Table</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  NModal, NFormItem, NInput, NSelect, NCheckbox, NCode,
  NButton, NSpace, NAlert, NTooltip, type SelectOption,
} from 'naive-ui';
import { Plus, Trash2 } from '@lucide/vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';

const show = defineModel<boolean>('show', { default: false });
const emit = defineEmits<{ success: [] }>();

const authStore = useAuthStore();
const notif = useNotificationStore();
const loading = ref(false);
const error = ref('');
const tableName = ref('');
const tableNameError = ref('');
let idCounter = 0;

interface Field {
  id: number;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  autoIncrement: boolean;
  notNull: boolean;
  unique: boolean;
  defaultValue: string;
}

const fields = ref<Field[]>([
  { id: idCounter++, name: 'id', type: 'INTEGER', isPrimaryKey: true, autoIncrement: true, notNull: false, unique: false, defaultValue: '' },
]);

const typeOptions: SelectOption[] = [
  'INTEGER', 'TEXT', 'REAL', 'BLOB', 'NUMERIC',
  'UUID', 'DATETIME', 'TIMESTAMP', 'DATE', 'TIME', 'BOOLEAN', 'JSON',
].map(t => ({ label: t, value: t }));

const TYPE_MAP: Record<string, string> = {
  UUID: 'TEXT', DATETIME: 'TEXT', TIMESTAMP: 'TEXT', DATE: 'TEXT',
  TIME: 'TEXT', BOOLEAN: 'INTEGER', JSON: 'TEXT',
};

function quoteIdent(name: string) {
  return `"${name.replace(/"/g, '""')}"`;
}

const generatedSQL = computed(() => {
  if (!tableName.value) return '-- Enter a table name to preview SQL';
  const pks = fields.value.filter(f => f.isPrimaryKey);
  const lines: string[] = [];
  for (const f of fields.value) {
    const sqlType = TYPE_MAP[f.type] ?? f.type;
    let def = `  ${quoteIdent(f.name)} ${sqlType}`;
    if (f.isPrimaryKey && pks.length === 1) def += ' PRIMARY KEY';
    if (f.isPrimaryKey && f.autoIncrement && f.type === 'INTEGER' && pks.length === 1) def += ' AUTOINCREMENT';
    if (f.notNull && !f.isPrimaryKey) def += ' NOT NULL';
    if (f.unique && !f.isPrimaryKey) def += ' UNIQUE';
    if (f.defaultValue) def += ` DEFAULT ${f.defaultValue}`;
    lines.push(def);
  }
  if (pks.length > 1) {
    lines.push(`  PRIMARY KEY (${pks.map(f => quoteIdent(f.name)).join(', ')})`);
  }
  return `CREATE TABLE ${quoteIdent(tableName.value)} (\n${lines.join(',\n')}\n);`;
});

function addField() {
  fields.value.push({ id: idCounter++, name: '', type: 'TEXT', isPrimaryKey: false, autoIncrement: false, notNull: false, unique: false, defaultValue: '' });
}

function removeField(idx: number) {
  if (fields.value.length > 1) fields.value.splice(idx, 1);
}

function onTypeChange(idx: number, type: string) {
  if (type !== 'INTEGER') fields.value[idx].autoIncrement = false;
}

function onPKChange(idx: number, val: boolean) {
  if (!val) fields.value[idx].autoIncrement = false;
}

function validateTableName() {
  const v = tableName.value.trim();
  if (!v) { tableNameError.value = 'Table name is required'; return false; }
  if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/.test(v)) {
    tableNameError.value = 'Only letters, numbers, underscores; must not start with a number';
    return false;
  }
  tableNameError.value = '';
  return true;
}

async function handleCreate() {
  if (!validateTableName()) return;
  const invalidFields = fields.value.filter(f => !f.name.trim());
  if (invalidFields.length > 0) {
    error.value = 'All columns must have a name';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const res = await authStore.apiClient.createTable(generatedSQL.value);
    if (res.success !== false) {
      notif.showToast({ message: 'Table created', type: 'success' });
      show.value = false;
      emit('success');
      // Reset
      tableName.value = '';
      fields.value = [{ id: idCounter++, name: 'id', type: 'INTEGER', isPrimaryKey: true, autoIncrement: true, notNull: false, unique: false, defaultValue: '' }];
    } else {
      error.value = res.error ?? 'Failed to create table';
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create table';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.vb-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.vb-editor {
  flex: 1;
  min-width: 0;
}

.vb-preview {
  width: 240px;
  flex-shrink: 0;
}

.vb-section-label {
  font-size: 11px;
  font-weight: 600;
  color: #8890a6;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 8px;
}

/* 8-column grid: name | type | pk | ai | nn | uq | default | delete */
.col-grid {
  display: grid;
  grid-template-columns: 1fr 100px 28px 28px 28px 28px 70px 24px;
  gap: 6px;
  align-items: center;
}

.col-header {
  padding-bottom: 8px;
  border-bottom: 1px solid #dde1eb;
  margin-bottom: 4px;
}

.col-row {
  margin-bottom: 6px;
}

.ch-left {
  font-size: 11px;
  font-weight: 600;
  color: #8890a6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ch-tag {
  font-size: 11px;
  font-weight: 700;
  color: #8890a6;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  text-align: center;
  display: block;
  cursor: help;
}

.check-cell {
  display: flex;
  justify-content: center;
}
</style>

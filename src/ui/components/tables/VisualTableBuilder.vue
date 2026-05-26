<template>
  <NModal v-model:show="show" title="Visual Table Builder" preset="card" style="width: 780px">
    <div style="display: flex; gap: 16px">
      <!-- Left: Config -->
      <div style="flex: 1">
        <NFormItem label="Table Name" :show-feedback="!!tableNameError">
          <NInput v-model:value="tableName" placeholder="my_table" @blur="validateTableName" />
          <template #feedback>{{ tableNameError }}</template>
        </NFormItem>

        <NDivider />

        <div v-for="(field, idx) in fields" :key="field.id" class="field-row">
          <NInput v-model:value="field.name" placeholder="column_name" size="small" style="width: 130px" />
          <NSelect
            v-model:value="field.type"
            :options="typeOptions"
            size="small"
            style="width: 120px"
            @update:value="(v) => onTypeChange(idx, v)"
          />
          <NSpace size="small" align="center">
            <NTooltip trigger="hover">
              <template #trigger>
                <NCheckbox v-model:checked="field.isPrimaryKey" @update:checked="(v) => onPKChange(idx, v)">PK</NCheckbox>
              </template>
              Primary Key
            </NTooltip>
            <NTooltip trigger="hover">
              <template #trigger>
                <NCheckbox v-model:checked="field.autoIncrement" :disabled="!field.isPrimaryKey || field.type !== 'INTEGER'">AI</NCheckbox>
              </template>
              Auto Increment (INTEGER PK only)
            </NTooltip>
            <NTooltip trigger="hover">
              <template #trigger>
                <NCheckbox v-model:checked="field.notNull">NN</NCheckbox>
              </template>
              Not Null
            </NTooltip>
            <NTooltip trigger="hover">
              <template #trigger>
                <NCheckbox v-model:checked="field.unique">UQ</NCheckbox>
              </template>
              Unique
            </NTooltip>
          </NSpace>
          <NInput v-model:value="field.defaultValue" placeholder="default" size="small" style="width: 80px" />
          <NButton text type="error" size="small" :disabled="fields.length <= 1" @click="removeField(idx)">
            <template #icon><Trash2 :size="13" /></template>
          </NButton>
        </div>

        <NButton dashed block style="margin-top: 8px" @click="addField">
          <template #icon><Plus :size="13" /></template>
          Add Column
        </NButton>
      </div>

      <!-- Right: SQL Preview -->
      <div style="flex: 1">
        <div class="sql-preview-label">SQL Preview</div>
        <NCode :code="generatedSQL" language="sql" style="font-size: 12px; max-height: 400px; overflow: auto" />
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
  NModal, NFormItem, NInput, NSelect, NCheckbox, NCode, NDivider,
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
.field-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: nowrap;
}

.sql-preview-label {
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
</style>

<template>
  <NModal v-model:show="show" :title="`Add Row — ${tableName}`" preset="card" style="width: 520px">
    <NSpin :show="schemaLoading">
      <NForm ref="formRef" :model="formData">
        <template v-for="col in visibleColumns" :key="col.name">
          <NFormItem
            :label="colLabel(col)"
            :path="col.name"
            :rule="colRule(col)"
          >
            <NInput v-model:value="formData[col.name]" :placeholder="colPlaceholder(col)" />
          </NFormItem>
        </template>
      </NForm>
    </NSpin>
    <NAlert v-if="error" type="error" :title="error" style="margin-top: 12px" />

    <template #footer>
      <NSpace justify="end">
        <NButton @click="show = false">Cancel</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit">Add Row</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { NModal, NForm, NFormItem, NInput, NButton, NSpace, NAlert, NSpin, type FormInst } from 'naive-ui';
import { useAuthStore } from '@/stores/auth';
import { useTableSchema } from '@/composables/useTableSchema';
import type { ColumnInfo, RowData } from '@/types';

const props = defineProps<{ tableName: string }>();
const show = defineModel<boolean>('show', { default: false });
const emit = defineEmits<{ success: [] }>();

const authStore = useAuthStore();
const { schema, loading: schemaLoading } = useTableSchema(authStore.apiClient, () => props.tableName);

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const error = ref('');
const formData = ref<Record<string, string>>({});

// Skip auto-increment INTEGER primary keys
const visibleColumns = computed<ColumnInfo[]>(() =>
  schema.value.filter(col => !(col.pk && col.type?.toUpperCase() === 'INTEGER'))
);

watch(schema, (cols) => {
  const data: Record<string, string> = {};
  for (const col of cols) {
    if (col.pk && col.type?.toUpperCase() === 'INTEGER') continue;
    data[col.name] = col.dflt_value != null ? String(col.dflt_value) : '';
  }
  formData.value = data;
}, { immediate: true });

watch(show, (val) => { if (!val) error.value = ''; });

function colLabel(col: ColumnInfo) {
  const parts = [col.name];
  if (col.pk) parts.push('🔑');
  if (col.notnull && col.dflt_value == null) parts.push('*');
  return parts.join(' ');
}

function colPlaceholder(col: ColumnInfo) {
  if (col.dflt_value != null) return `Default: ${col.dflt_value}`;
  if (col.notnull) return 'Required';
  return 'Optional';
}

function colRule(col: ColumnInfo) {
  if (col.notnull && col.dflt_value == null) {
    return { required: true, message: `${col.name} is required`, trigger: 'blur' };
  }
  return undefined;
}

async function handleSubmit() {
  try { await formRef.value?.validate(); } catch { return; }
  loading.value = true; error.value = '';
  try {
    const payload: RowData = {};
    for (const col of visibleColumns.value) {
      const val = formData.value[col.name];
      if (val === '' || val === undefined) {
        if (col.notnull && col.dflt_value == null) { error.value = `${col.name} is required`; loading.value = false; return; }
        continue;
      }
      const t = col.type?.toUpperCase();
      if (t === 'INTEGER') payload[col.name] = parseInt(val);
      else if (t === 'REAL') payload[col.name] = parseFloat(val);
      else payload[col.name] = val;
    }
    const res = await authStore.apiClient.insertRow(props.tableName, payload);
    if (res.success !== false) {
      show.value = false;
      emit('success');
    } else {
      error.value = res.error ?? 'Failed to add row';
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to add row';
  } finally {
    loading.value = false;
  }
}
</script>

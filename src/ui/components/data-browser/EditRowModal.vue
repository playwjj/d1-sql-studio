<template>
  <NModal v-model:show="show" :title="`Edit Row — ${tableName}`" preset="card" style="width: 520px">
    <NSpin :show="schemaLoading">
      <NForm ref="formRef" :model="formData">
        <template v-for="col in schema" :key="col.name">
          <NFormItem :label="colLabel(col)" :path="col.name">
            <NInput
              v-model:value="formData[col.name]"
              :disabled="col.pk === 1"
              :placeholder="col.pk ? 'Primary key (read-only)' : col.notnull ? 'Required' : 'Optional'"
              :style="col.pk ? 'opacity:0.6' : ''"
            />
          </NFormItem>
        </template>
      </NForm>
    </NSpin>
    <NAlert v-if="error" type="error" :title="error" style="margin-top: 12px" />

    <template #footer>
      <NSpace justify="end">
        <NButton @click="show = false">Cancel</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit">Update Row</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { NModal, NForm, NFormItem, NInput, NButton, NSpace, NAlert, NSpin, type FormInst } from 'naive-ui';
import { useAuthStore } from '@/stores/auth';
import { useTableSchema } from '@/composables/useTableSchema';
import type { ColumnInfo, RowData } from '@/types';

const props = defineProps<{ tableName: string; rowData: RowData }>();
const show = defineModel<boolean>('show', { default: false });
const emit = defineEmits<{ success: [] }>();

const authStore = useAuthStore();
const { schema, loading: schemaLoading } = useTableSchema(authStore.apiClient, () => props.tableName);

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const error = ref('');
const formData = ref<Record<string, string>>({});

watch(() => props.rowData, (row) => {
  const data: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    data[k] = v == null ? '' : String(v);
  }
  formData.value = data;
}, { immediate: true });

watch(show, (val) => { if (!val) error.value = ''; });

function colLabel(col: ColumnInfo) {
  if (col.pk) return `${col.name} 🔑`;
  if (col.notnull) return `${col.name} *`;
  return col.name;
}

async function handleSubmit() {
  loading.value = true; error.value = '';
  try {
    const pkCol = schema.value.find(c => c.pk === 1);
    if (!pkCol) { error.value = 'No primary key found'; loading.value = false; return; }
    const pkVal = String(props.rowData[pkCol.name]);
    const payload: RowData = {};
    for (const col of schema.value) {
      if (col.pk) continue;
      const val = formData.value[col.name];
      if (val === '' || val === undefined) {
        if (col.notnull) { error.value = `${col.name} is required`; loading.value = false; return; }
        payload[col.name] = null;
        continue;
      }
      const t = col.type?.toUpperCase();
      if (t === 'INTEGER') payload[col.name] = parseInt(val);
      else if (t === 'REAL') payload[col.name] = parseFloat(val);
      else payload[col.name] = val;
    }
    const res = await authStore.apiClient.updateRow(props.tableName, pkVal, payload);
    if (res.success !== false) {
      show.value = false;
      emit('success');
    } else {
      error.value = res.error ?? 'Failed to update row';
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to update row';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NModal v-model:show="show" title="Create Table" size="medium" preset="card" style="width: 600px">
    <NForm ref="formRef" :model="form" :rules="rules">
      <NFormItem path="sql" label="SQL Statement">
        <NInput
          v-model:value="form.sql"
          type="textarea"
          placeholder="CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE
);"
          :autosize="{ minRows: 6, maxRows: 16 }"
          :disabled="loading"
          style="font-family: monospace; font-size: 13px"
        />
      </NFormItem>
      <NAlert type="info" style="margin-bottom: 8px">
        Use double-quotes for column names that are SQL keywords, e.g., <NText code>"order"</NText>.
      </NAlert>
    </NForm>
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
import { ref, watch } from 'vue';
import { NModal, NForm, NFormItem, NInput, NButton, NSpace, NAlert, NText, type FormRules, type FormInst } from 'naive-ui';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';

const show = defineModel<boolean>('show', { default: false });
const emit = defineEmits<{ success: [] }>();

const authStore = useAuthStore();
const notif = useNotificationStore();

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const error = ref('');
const form = ref({ sql: '' });

const rules: FormRules = {
  sql: [
    { required: true, message: 'SQL is required', trigger: 'blur' },
    { min: 10, message: 'SQL must be at least 10 characters', trigger: 'blur' },
    {
      validator: (_rule, value: string) => {
        if (!value.trim().toUpperCase().startsWith('CREATE TABLE')) {
          return new Error('SQL must start with CREATE TABLE');
        }
        return true;
      },
      trigger: 'blur',
    },
  ],
};

watch(show, (val) => {
  if (!val) { form.value.sql = ''; error.value = ''; }
});

async function handleCreate() {
  try { await formRef.value?.validate(); } catch { return; }
  loading.value = true;
  error.value = '';
  try {
    const res = await authStore.apiClient.createTable(form.value.sql);
    if (res.success !== false) {
      notif.showToast({ message: 'Table created', type: 'success' });
      show.value = false;
      emit('success');
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

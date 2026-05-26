<template>
  <div class="view-container">
    <div class="view-header">
      <div class="view-title">
        <Key :size="18" />
        <h2>API Keys</h2>
      </div>
      <NButton type="primary" @click="showCreateForm = !showCreateForm">
        <template #icon><Plus :size="14" /></template>
        New Key
      </NButton>
    </div>

    <!-- Create form -->
    <NCard v-if="showCreateForm" style="margin-bottom: 20px" :bordered="true">
      <template v-if="!newGeneratedKey">
        <NForm ref="createFormRef" :model="createForm" :rules="createRules">
          <NFormItem path="name" label="Key Name">
            <NInput v-model:value="createForm.name" placeholder="My API Key" :disabled="creating" />
          </NFormItem>
          <NFormItem path="description" label="Description (optional)">
            <NInput
              v-model:value="createForm.description"
              type="textarea"
              placeholder="Optional description"
              :disabled="creating"
              :autosize="{ minRows: 2, maxRows: 4 }"
            />
          </NFormItem>
          <NSpace>
            <NButton type="primary" :loading="creating" @click="handleCreate">Generate Key</NButton>
            <NButton @click="showCreateForm = false">Cancel</NButton>
          </NSpace>
        </NForm>
      </template>
      <template v-else>
        <NAlert type="success" title="API Key Generated!" style="margin-bottom: 12px">
          Copy and save this key — it won't be shown again.
        </NAlert>
        <NInputGroup style="margin-bottom: 12px">
          <NInput :value="newGeneratedKey" readonly />
          <NButton @click="copyNewKey">{{ copied ? 'Copied!' : 'Copy' }}</NButton>
        </NInputGroup>
        <NButton @click="dismissNewKey">Done</NButton>
      </template>
    </NCard>

    <NSpin :show="loading">
      <NAlert v-if="error" type="error" :title="error" style="margin-bottom: 12px" />
      <NDataTable
        :columns="columns"
        :data="keys"
        :pagination="false"
        :bordered="false"
        size="small"
        striped
      />
      <NEmpty v-if="!loading && keys.length === 0" description="No API keys yet" style="margin: 40px auto">
        <template #icon><Key :size="40" /></template>
      </NEmpty>
    </NSpin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import {
  NDataTable, NButton, NCard, NForm, NFormItem, NInput, NInputGroup,
  NSpace, NSpin, NAlert, NEmpty,
  type DataTableColumns, type FormRules, type FormInst,
} from 'naive-ui';
import { Key, Plus, Trash2 } from '@lucide/vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import type { ApiKeyInfo } from '@/types';

const authStore = useAuthStore();
const notif = useNotificationStore();

const keys = ref<ApiKeyInfo[]>([]);
const loading = ref(false);
const error = ref('');
const showCreateForm = ref(false);
const creating = ref(false);
const newGeneratedKey = ref('');
const copied = ref(false);
const createFormRef = ref<FormInst | null>(null);
const createForm = ref({ name: '', description: '' });

const createRules: FormRules = {
  name: [
    { required: true, message: 'Key name is required', trigger: 'blur' },
    { min: 3, max: 50, message: 'Name must be 3–50 characters', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9 \-_]+$/, message: 'Only letters, numbers, spaces, hyphens, underscores', trigger: 'blur' },
  ],
};

const columns: DataTableColumns<ApiKeyInfo> = [
  { title: 'Name', key: 'name' },
  { title: 'Description', key: 'description', render: row => row.description ?? '—' },
  {
    title: 'Created',
    key: 'createdAt',
    render: row => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—',
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 80,
    render: (row) => h(NButton, {
      size: 'small', type: 'error',
      onClick: () => handleDelete(row.id, row.name),
    }, { icon: () => h(Trash2, { size: 13 }) }),
  },
];

async function loadKeys() {
  loading.value = true;
  error.value = '';
  try {
    const res = await authStore.apiClient.listApiKeys();
    if (res.success && res.data) {
      keys.value = res.data as ApiKeyInfo[];
    } else {
      error.value = res.error ?? 'Failed to load keys';
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load keys';
  } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  try { await createFormRef.value?.validate(); } catch { return; }
  creating.value = true;
  try {
    const res = await authStore.apiClient.createApiKey(createForm.value.name, createForm.value.description);
    if (res.success && res.data) {
      newGeneratedKey.value = (res.data as { key: string }).key;
      createForm.value = { name: '', description: '' };
      await loadKeys();
    } else {
      notif.showToast({ message: res.error ?? 'Failed to create key', type: 'error' });
    }
  } catch {
    notif.showToast({ message: 'Failed to create key', type: 'error' });
  } finally {
    creating.value = false;
  }
}

async function copyNewKey() {
  await navigator.clipboard.writeText(newGeneratedKey.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

function dismissNewKey() {
  newGeneratedKey.value = '';
  showCreateForm.value = false;
}

async function handleDelete(id: string, name: string) {
  const ok = await notif.showConfirm({
    title: `Delete "${name}"?`,
    content: 'This key will stop working immediately.',
    type: 'warning',
    positiveText: 'Delete',
  });
  if (!ok) return;
  try {
    const res = await authStore.apiClient.deleteApiKey(id);
    if (res.success !== false) {
      notif.showToast({ message: `Key "${name}" deleted`, type: 'success' });
      await loadKeys();
    } else {
      notif.showToast({ message: res.error ?? 'Delete failed', type: 'error' });
    }
  } catch {
    notif.showToast({ message: 'Delete failed', type: 'error' });
  }
}

onMounted(loadKeys);
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

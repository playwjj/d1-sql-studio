<template>
  <div class="setup-page">
    <NCard class="setup-card" :bordered="false">
      <div class="setup-header">
        <div class="logo">
          <Database :size="32" color="#18a058" />
        </div>
        <h1>Welcome to D1 SQL Studio</h1>
        <p class="subtitle">Create your first API key to get started</p>
      </div>

      <!-- Key created state -->
      <template v-if="generatedKey">
        <NAlert type="success" title="API Key Created!" style="margin-bottom: 16px">
          Save this key — it won't be shown again.
        </NAlert>
        <NInputGroup style="margin-bottom: 16px">
          <NInput :value="generatedKey" readonly type="text" />
          <NButton @click="copyKey">{{ copied ? 'Copied!' : 'Copy' }}</NButton>
        </NInputGroup>
        <NButton type="primary" size="large" block @click="handleContinue">
          Continue to Dashboard
        </NButton>
      </template>

      <!-- Form state -->
      <template v-else>
        <NForm ref="formRef" :model="form" :rules="rules" @submit.prevent="handleCreate">
          <NFormItem path="name" label="Key Name">
            <NInput v-model:value="form.name" placeholder="Default Key" :disabled="loading" />
          </NFormItem>
          <NFormItem path="description" label="Description (optional)">
            <NInput
              v-model:value="form.description"
              type="textarea"
              placeholder="A description for this key"
              :disabled="loading"
              :autosize="{ minRows: 2, maxRows: 4 }"
            />
          </NFormItem>
          <NAlert type="info" style="margin-bottom: 16px">
            Your API key provides full access to this D1 database. Keep it secure.
          </NAlert>
          <NButton type="primary" size="large" block :loading="loading" @click="handleCreate">
            Generate API Key
          </NButton>
        </NForm>
        <NAlert v-if="error" type="error" :title="error" style="margin-top: 16px" />
      </template>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NCard, NForm, NFormItem, NInput, NInputGroup, NButton, NAlert, type FormRules, type FormInst } from 'naive-ui';
import { Database } from '@lucide/vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const error = ref('');
const generatedKey = ref('');
const copied = ref(false);

const form = ref({ name: 'Default Key', description: '' });

const rules: FormRules = {
  name: [
    { required: true, message: 'Key name is required', trigger: 'blur' },
    { min: 3, max: 50, message: 'Name must be 3–50 characters', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9 \-_]+$/, message: 'Only letters, numbers, spaces, hyphens, underscores', trigger: 'blur' },
  ],
  description: [
    { max: 200, message: 'Description must be 200 characters or less', trigger: 'blur' },
  ],
};

async function handleCreate() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.value.name, description: form.value.description }),
    });
    const result = await res.json();
    if (result.success && result.data?.key) {
      generatedKey.value = result.data.key;
    } else {
      error.value = result.error ?? 'Failed to create key';
    }
  } catch {
    error.value = 'Failed to create key';
  } finally {
    loading.value = false;
  }
}

async function copyKey() {
  await navigator.clipboard.writeText(generatedKey.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

async function handleContinue() {
  await authStore.login(generatedKey.value);
  authStore.hasKeys = true;
}
</script>

<style scoped>
.setup-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.setup-card {
  width: 480px;
  padding: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  border-radius: 12px;
}

.setup-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.setup-header h1 {
  font-size: 20px;
  font-weight: 700;
  color: #18a058;
  margin: 0 0 4px;
}

.subtitle {
  font-size: 13px;
  color: #7e8494;
  margin: 0;
}
</style>

<template>
  <div class="login-page">
    <NCard class="login-card" :bordered="false">
      <div class="login-header">
        <div class="logo">
          <Database :size="32" color="#18a058" />
        </div>
        <h1>D1 SQL Studio</h1>
        <p class="subtitle">Cloudflare D1 Database Manager</p>
      </div>

      <NForm ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
        <NFormItem path="apiKey" label="API Key">
          <NInput
            v-model:value="form.apiKey"
            type="password"
            show-password-on="click"
            placeholder="Enter your API key"
            size="large"
            :disabled="loading"
            @keydown.enter="handleLogin"
          />
        </NFormItem>
        <NButton
          type="primary"
          size="large"
          block
          :loading="loading"
          @click="handleLogin"
        >
          Sign In
        </NButton>
      </NForm>

      <NAlert v-if="error" type="error" :title="error" style="margin-top: 16px" />
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NCard, NForm, NFormItem, NInput, NButton, NAlert, type FormRules, type FormInst } from 'naive-ui';
import { Database } from '@lucide/vue';
import { ApiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const error = ref('');

const form = ref({ apiKey: authStore.apiKey });

const rules: FormRules = {
  apiKey: [
    { required: true, message: 'API key is required', trigger: 'blur' },
    { min: 10, message: 'API key must be at least 10 characters', trigger: 'blur' },
  ],
};

async function handleLogin() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const client = new ApiClient(form.value.apiKey);
    const res = await client.listTables();
    if (res.success !== false) {
      await authStore.login(form.value.apiKey);
    } else {
      error.value = res.error ?? 'Invalid API key';
    }
  } catch {
    error.value = 'Failed to connect. Check your API key.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.login-card {
  width: 400px;
  padding: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  border-radius: 12px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.login-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: #18a058;
  margin: 0 0 4px;
}

.subtitle {
  font-size: 13px;
  color: #999;
  margin: 0;
}
</style>

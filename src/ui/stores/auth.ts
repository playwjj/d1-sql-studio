import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ApiClient } from '@/lib/api';
import router from '@/router';

export const useAuthStore = defineStore('auth', () => {
  const apiKey = ref<string>(localStorage.getItem('d1_api_key') ?? '');
  const isAuthenticated = ref(false);
  const hasKeys = ref<boolean | null>(null);
  const hasCheckedKeysStatus = ref(false);

  const apiClient = computed(() => new ApiClient(apiKey.value));

  async function checkKeysStatus() {
    try {
      const res = await fetch('/api/keys/status');
      const result = await res.json();
      if (result.success && result.data) {
        hasKeys.value = result.data.hasKeys;
      } else {
        hasKeys.value = true;
      }
    } catch {
      hasKeys.value = true;
    } finally {
      hasCheckedKeysStatus.value = true;
    }
  }

  async function login(key: string) {
    apiKey.value = key;
    isAuthenticated.value = true;
    localStorage.setItem('d1_api_key', key);
  }

  function logout() {
    apiKey.value = '';
    isAuthenticated.value = false;
    localStorage.removeItem('d1_api_key');
    router.push({ name: 'login' });
  }

  // Auto-authenticate from saved key on store init
  if (apiKey.value) {
    isAuthenticated.value = true;
  }

  return { apiKey, isAuthenticated, hasKeys, hasCheckedKeysStatus, apiClient, checkKeysStatus, login, logout };
});

<template>
  <NConfigProvider :theme="null" :theme-overrides="themeOverrides">
    <NMessageProvider>
      <NDialogProvider>
        <AppProviderInit />
        <RouterView />
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider, useMessage, useDialog, type GlobalThemeOverrides } from 'naive-ui';

const themeOverrides: GlobalThemeOverrides = {
  common: {
    bodyColor: '#f0f2f5',
    cardColor: '#ffffff',
    modalColor: '#ffffff',
    popoverColor: '#ffffff',
    dividerColor: '#dde1eb',
    borderColor: 'rgba(180, 184, 200, 0.7)',
  },
  Layout: {
    color: '#f0f2f5',
    siderColor: '#e9ebf2',
  },
  DataTable: {
    thColor: '#f4f5fa',
    thColorHover: '#eceef6',
    tdColorHover: '#edf0f9',
    borderColor: '#dde1eb',
  },
  Input: {
    color: '#f8f9fc',
    colorFocus: '#ffffff',
  },
};
import { defineComponent, onMounted, h } from 'vue';
import { RouterView } from 'vue-router';
import { useNotificationStore } from './stores/notification';

// Inner component that can access Message/Dialog providers
const AppProviderInit = defineComponent({
  setup() {
    const message = useMessage();
    const dialog = useDialog();
    const notificationStore = useNotificationStore();
    onMounted(() => notificationStore.init(message, dialog));
    return () => h('span');
  },
});
</script>

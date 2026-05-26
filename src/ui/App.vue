<template>
  <NConfigProvider :theme="null">
    <NMessageProvider>
      <NDialogProvider>
        <AppProviderInit />
        <RouterView />
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider, useMessage, useDialog } from 'naive-ui';
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

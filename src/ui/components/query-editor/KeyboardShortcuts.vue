<template>
  <NModal v-model:show="show" title="Keyboard Shortcuts" preset="card" style="width: 400px">
    <NList bordered>
      <NListItem v-for="s in shortcuts" :key="s.key">
        <template #prefix><NTag size="small" style="font-family: monospace">{{ s.key }}</NTag></template>
        {{ s.description }}
      </NListItem>
    </NList>
    <template #footer>
      <NButton @click="show = false">Close</NButton>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { NModal, NList, NListItem, NTag, NButton } from 'naive-ui';

const show = defineModel<boolean>('show', { default: false });

const shortcuts = [
  { key: 'Ctrl+Enter / ⌘+Enter', description: 'Execute query' },
  { key: 'Ctrl+K / ⌘+K', description: 'Format SQL' },
  { key: 'Ctrl+H / ⌘+H', description: 'Show query history' },
  { key: 'Ctrl+Z / ⌘+Z', description: 'Undo' },
  { key: 'Ctrl+Shift+Z', description: 'Redo' },
  { key: 'Tab', description: 'Indent' },
  { key: 'Shift+Tab', description: 'Outdent' },
];
</script>

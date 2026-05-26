<template>
  <NModal v-model:show="show" title="Query History" preset="card" style="width: 680px; max-height: 80vh">
    <NSpace style="margin-bottom: 12px" align="center">
      <NInput v-model:value="search" placeholder="Search queries..." clearable style="width: 280px" />
      <NRadioGroup v-model:value="filter" size="small">
        <NRadioButton value="all">All</NRadioButton>
        <NRadioButton value="success">Success</NRadioButton>
        <NRadioButton value="failed">Failed</NRadioButton>
      </NRadioGroup>
      <NButton type="error" size="small" text @click="handleClearAll">Clear All</NButton>
    </NSpace>

    <NEmpty v-if="filtered.length === 0" description="No history" style="margin: 24px auto" />

    <div v-else class="history-list">
      <div v-for="item in filtered" :key="item.id" class="history-item">
        <div class="history-item-header">
          <NTag :type="item.success ? 'success' : 'error'" size="small">
            {{ item.success ? '✓' : '✗' }}
          </NTag>
          <NText depth="3" style="font-size: 11px">{{ formatTime(item.timestamp) }}</NText>
          <NText v-if="item.rowCount !== undefined" depth="3" style="font-size: 11px">{{ item.rowCount }} rows</NText>
          <NText v-if="item.duration" depth="3" style="font-size: 11px">{{ item.duration }}</NText>
          <NSpace style="margin-left: auto" size="small">
            <NButton text size="small" @click="emit('use', item.query)">Use</NButton>
            <NButton text type="error" size="small" @click="handleDelete(item.id)">Delete</NButton>
          </NSpace>
        </div>
        <NText style="font-size: 12px; font-family: monospace; white-space: pre-wrap; word-break: break-all">
          {{ item.query }}
        </NText>
        <NText v-if="item.error" type="error" style="font-size: 12px">{{ item.error }}</NText>
      </div>
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="show = false">Close</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  NModal, NSpace, NInput, NRadioGroup, NRadioButton, NButton,
  NEmpty, NTag, NText,
} from 'naive-ui';
import { QueryHistoryManager, type QueryHistoryItem } from '@/lib/queryHistory';
import { useNotificationStore } from '@/stores/notification';

const show = defineModel<boolean>('show', { default: false });
const emit = defineEmits<{ use: [query: string] }>();

const notif = useNotificationStore();
const search = ref('');
const filter = ref<'all' | 'success' | 'failed'>('all');

const allHistory = computed(() => QueryHistoryManager.getHistory());

const filtered = computed<QueryHistoryItem[]>(() => {
  let items = allHistory.value;
  if (filter.value === 'success') items = items.filter(i => i.success);
  if (filter.value === 'failed') items = items.filter(i => !i.success);
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    items = items.filter(i => i.query.toLowerCase().includes(q));
  }
  return items;
});

function formatTime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(ts).toLocaleDateString();
}

async function handleClearAll() {
  const ok = await notif.showConfirm({ content: 'Clear all query history?', type: 'warning', positiveText: 'Clear' });
  if (ok) QueryHistoryManager.clearHistory();
}

function handleDelete(id: string) {
  QueryHistoryManager.deleteItem(id);
}
</script>

<style scoped>
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 450px;
  overflow-y: auto;
}

.history-item {
  padding: 8px 10px;
  border: 1px solid #dde1eb;
  border-radius: 6px;
  cursor: default;
}

.history-item:hover { background: #fafafa; }

.history-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
</style>

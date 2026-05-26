<template>
  <div class="results-container">
    <NModal v-model:show="showExpandModal" preset="card" :title="expandedCell?.col" style="max-width: 640px; width: 90vw">
      <NScrollbar style="max-height: 60vh">
        <pre class="expanded-cell-content">{{ expandedCell?.value }}</pre>
      </NScrollbar>
    </NModal>
    <div class="results-header">
      <NText depth="3" style="font-size: 12px">
        {{ result.results?.length ?? 0 }} row{{ (result.results?.length ?? 0) !== 1 ? 's' : '' }}
        <template v-if="result.meta?.duration"> · {{ result.meta.duration }}</template>
        <template v-if="result.meta?.changes"> · {{ result.meta.changes }} change{{ result.meta.changes !== 1 ? 's' : '' }}</template>
      </NText>
    </div>

    <template v-if="result.results && result.results.length > 0">
      <NDataTable
        class="results-table"
        :columns="tableColumns"
        :data="result.results"
        :pagination="{ pageSize: 50, showSizePicker: true, pageSizes: [25, 50, 100, 200] }"
        :bordered="true"
        :single-line="false"
        size="small"
        :max-height="props.maxHeight ?? 'calc(100vh - 420px)'"
        :scroll-x="scrollX"
      />
    </template>
    <template v-else>
      <NAlert type="success" style="margin: 12px 16px">
        Query executed successfully.
        <template v-if="result.meta?.changes">
          {{ result.meta.changes }} row{{ result.meta.changes !== 1 ? 's' : '' }} affected.
        </template>
      </NAlert>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { NDataTable, NText, NAlert, NTooltip, NModal, NScrollbar, type DataTableColumns } from 'naive-ui';
import { useNotificationStore } from '@/stores/notification';
import type { QueryResult, RowData } from '@/types';
import NullValue from '@/components/shared/NullValue.vue';

const props = defineProps<{ result: QueryResult; maxHeight?: string }>();

const notif = useNotificationStore();
const showExpandModal = ref(false);
const expandedCell = ref<{ col: string; value: string } | null>(null);

function copyCell(val: string, e: MouseEvent) {
  e.stopPropagation();
  navigator.clipboard?.writeText(val)
    .then(() => notif.showToast({ message: 'Copied', type: 'success' }))
    .catch(() => notif.showToast({ message: 'Copy failed', type: 'warning' }));
}

function expandCell(col: string, val: string, e: MouseEvent) {
  e.stopPropagation();
  expandedCell.value = { col, value: val };
  showExpandModal.value = true;
}

const tableColumns = computed<DataTableColumns<RowData>>(() => {
  const rows = props.result.results ?? [];
  if (rows.length === 0) return [];
  return Object.keys(rows[0]).map(col => ({
    title: () => h('span', { class: 'col-title' }, col),
    key: col,
    width: 150,
    sorter: (a: RowData, b: RowData) => {
      const av = a[col], bv = b[col];
      if (av === null) return -1;
      if (bv === null) return 1;
      return typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
    },
    render: (row: RowData) => {
      const val = row[col];
      if (val === null || val === undefined) return h(NullValue);
      const str = String(val);
      if (str.length > 200) {
        return h('span', {
          class: 'cell-text cell-long',
          title: 'Click to copy · Double-click to expand',
          onClick: (e: MouseEvent) => copyCell(str, e),
          onDblclick: (e: MouseEvent) => expandCell(col, str, e),
        }, str);
      }
      return h(NTooltip, { trigger: 'hover', placement: 'top-start', keepAliveOnHover: false }, {
        trigger: () => h('span', {
          class: 'cell-text',
          onClick: (e: MouseEvent) => copyCell(str, e),
        }, str),
        default: () => h('span', { style: 'white-space: pre-wrap; word-break: break-all' }, str),
      });
    },
  }));
});

const scrollX = computed(() => {
  const rows = props.result.results ?? [];
  if (rows.length === 0) return 600;
  return Math.max(600, Object.keys(rows[0]).length * 150);
});
</script>

<style scoped>
.results-container { height: 100%; }

.results-header {
  padding: 6px 16px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.col-title) {
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 12px;
  font-weight: 600;
  color: #555;
}

:deep(.results-table .n-data-table-td) {
  padding-top: 8px;
  padding-bottom: 8px;
}

:deep(.cell-text) {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  cursor: pointer;
}

:deep(.cell-long) {
  color: #999;
  font-style: italic;
}

.expanded-cell-content {
  margin: 0;
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.6;
}
</style>

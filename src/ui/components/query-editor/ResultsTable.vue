<template>
  <div class="results-container">
    <div class="results-header">
      <NText depth="3" style="font-size: 12px">
        {{ result.results?.length ?? 0 }} row{{ (result.results?.length ?? 0) !== 1 ? 's' : '' }}
        <template v-if="result.meta?.duration"> · {{ result.meta.duration }}</template>
        <template v-if="result.meta?.changes"> · {{ result.meta.changes }} change{{ result.meta.changes !== 1 ? 's' : '' }}</template>
      </NText>
    </div>

    <template v-if="result.results && result.results.length > 0">
      <NDataTable
        :columns="tableColumns"
        :data="result.results"
        :pagination="{ pageSize: 50, showSizePicker: true, pageSizes: [25, 50, 100, 200] }"
        :bordered="true"
        size="small"
        :max-height="'calc(100vh - 420px)'"
        virtual-scroll
        :scroll-x="scrollX"
        striped
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
import { computed, h } from 'vue';
import { NDataTable, NText, NAlert, type DataTableColumns } from 'naive-ui';
import type { QueryResult, RowData } from '@/types';
import NullValue from '@/components/shared/NullValue.vue';

const props = defineProps<{ result: QueryResult }>();

const tableColumns = computed<DataTableColumns<RowData>>(() => {
  const rows = props.result.results ?? [];
  if (rows.length === 0) return [];
  return Object.keys(rows[0]).map(col => ({
    title: col,
    key: col,
    width: 150,
    ellipsis: { tooltip: true },
    sorter: (a: RowData, b: RowData) => {
      const av = a[col], bv = b[col];
      if (av === null) return -1;
      if (bv === null) return 1;
      return typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
    },
    render: (row: RowData) =>
      row[col] === null || row[col] === undefined ? h(NullValue) : String(row[col]),
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
</style>

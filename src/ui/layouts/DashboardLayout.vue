<template>
  <NLayout has-sider style="height: 100vh">
    <NLayoutSider
      :width="220"
      :collapsed-width="0"
      bordered
      show-trigger="arrow-circle"
      :native-scrollbar="false"
      style="display: flex; flex-direction: column"
    >
      <!-- Header -->
      <div class="sidebar-header">
        <Database :size="18" color="#18a058" />
        <span class="sidebar-title">D1 SQL Studio</span>
      </div>

      <!-- Navigation menu -->
      <NMenu
        :value="currentRoute"
        :options="menuOptions"
        :indent="18"
        @update:value="handleNav"
      />

      <!-- Table list -->
      <NDivider style="margin: 8px 0" />
      <div class="sidebar-section-label">Tables</div>
      <div class="sidebar-search">
        <NInput
          v-model:value="tableFilter"
          placeholder="Filter tables…"
          size="small"
          clearable
        >
          <template #prefix><Search :size="12" color="#8890a6" /></template>
        </NInput>
      </div>
      <NSpin v-if="tablesStore.loading" size="small" style="margin: 12px auto; display: block" />
      <template v-else>
        <NMenu
          v-if="filteredTableOptions.length > 0"
          :value="tablesStore.selectedTable"
          :options="filteredTableOptions"
          :indent="18"
          @update:value="handleTableSelect"
        />
        <div v-else-if="tableFilter" class="sidebar-no-match">No match</div>
      </template>

      <div style="flex: 1" />

      <!-- Footer -->
      <div class="sidebar-footer">
        <NButton text size="small" @click="authStore.logout()">
          <template #icon><LogOut :size="14" /></template>
          Sign Out
        </NButton>
      </div>
    </NLayoutSider>

    <NLayoutContent :native-scrollbar="false">
      <RouterView />
    </NLayoutContent>
  </NLayout>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, h } from 'vue';
import { useRoute, useRouter, RouterView } from 'vue-router';
import {
  NLayout, NLayoutSider, NLayoutContent, NMenu, NDivider, NSpin, NButton, NInput,
  type MenuOption,
} from 'naive-ui';
import { Database, Table2, Search, Code2, Key, LogOut } from '@lucide/vue';
import { useAuthStore } from '@/stores/auth';
import { useTablesStore } from '@/stores/tables';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const tablesStore = useTablesStore();

const currentRoute = computed(() => route.name as string);

const menuOptions: MenuOption[] = [
  { label: 'Tables',    key: 'tables', icon: () => h(Table2, { size: 15 }) },
  { label: 'SQL Query', key: 'query',  icon: () => h(Code2,  { size: 15 }) },
  { label: 'API Keys',  key: 'keys',   icon: () => h(Key,    { size: 15 }) },
];

const tableFilter = ref('');

const filteredTableOptions = computed<MenuOption[]>(() => {
  const q = tableFilter.value.toLowerCase();
  return tablesStore.tableList
    .filter(t => !q || t.name.toLowerCase().includes(q))
    .map(t => ({
      label: t.name,
      key: t.name,
      icon: () => h(Table2, { size: 13 }),
    }));
});

function handleNav(key: string) {
  router.push({ name: key });
}

function handleTableSelect(tableName: string) {
  tablesStore.selectTable(tableName);
  router.push({ name: 'data' });
}

onMounted(() => {
  tablesStore.loadTables(authStore.apiClient);
});
</script>

<style scoped>
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid #dde1eb;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 700;
  color: #1c1f2e;
}

.sidebar-section-label {
  padding: 0 18px 4px;
  font-size: 11px;
  font-weight: 600;
  color: #7e8494;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-search {
  padding: 0 10px 8px;
}

.sidebar-no-match {
  padding: 6px 18px;
  font-size: 12px;
  color: #bbb;
}

.sidebar-footer {
  padding: 12px 18px;
  border-top: 1px solid #dde1eb;
}
</style>

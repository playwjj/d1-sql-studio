<template>
  <div class="api-docs">
    <div v-for="example in examples" :key="example.id" class="api-example">
      <div class="example-header">
        <NTag :type="methodType(example.method)" size="small" style="font-family: monospace; font-weight: 700">
          {{ example.method }}
        </NTag>
        <span class="example-title">{{ example.title }}</span>
        <NButton
          text
          size="small"
          style="margin-left: auto"
          @click="copyExample(example)"
        >
          {{ copied === example.id ? '✓ Copied' : '📋 Copy' }}
        </NButton>
      </div>
      <NCode :code="example.curl" language="bash" :word-wrap="true" style="font-size: 12px; margin-top: 6px" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NTag, NButton, NCode } from 'naive-ui';

const props = defineProps<{ tableName: string }>();

const copied = ref<string | null>(null);
const apiUrl = window.location.origin;
const apiKey = localStorage.getItem('d1_api_key') ?? 'YOUR_API_KEY';

const examples = computed(() => [
  {
    id: 'list', method: 'GET', title: 'Get Table Data',
    curl: `curl -H "Authorization: Bearer ${apiKey}" \\\n  "${apiUrl}/api/tables/${props.tableName}/rows?page=1&limit=50"`,
  },
  {
    id: 'get-row', method: 'GET', title: 'Get Row by ID',
    curl: `curl -H "Authorization: Bearer ${apiKey}" \\\n  "${apiUrl}/api/tables/${props.tableName}/rows/1"`,
  },
  {
    id: 'schema', method: 'GET', title: 'Get Table Schema',
    curl: `curl -H "Authorization: Bearer ${apiKey}" \\\n  "${apiUrl}/api/tables/${props.tableName}/schema"`,
  },
  {
    id: 'insert', method: 'POST', title: 'Insert Row',
    curl: `curl -X POST -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"John","email":"john@example.com"}' \\\n  "${apiUrl}/api/tables/${props.tableName}/rows"`,
  },
  {
    id: 'update', method: 'PUT', title: 'Update Row',
    curl: `curl -X PUT -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Jane"}' \\\n  "${apiUrl}/api/tables/${props.tableName}/rows/1"`,
  },
  {
    id: 'delete', method: 'DELETE', title: 'Delete Row',
    curl: `curl -X DELETE -H "Authorization: Bearer ${apiKey}" \\\n  "${apiUrl}/api/tables/${props.tableName}/rows/1"`,
  },
  {
    id: 'query', method: 'POST', title: 'Execute SQL',
    curl: `curl -X POST -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"sql":"SELECT * FROM ${props.tableName} LIMIT 10"}' \\\n  "${apiUrl}/api/query"`,
  },
]);

function methodType(method: string): 'info' | 'success' | 'warning' | 'error' | 'default' {
  const map: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
    GET: 'info', POST: 'success', PUT: 'warning', DELETE: 'error',
  };
  return map[method] ?? 'default';
}

async function copyExample(example: { id: string; curl: string }) {
  await navigator.clipboard.writeText(example.curl);
  copied.value = example.id;
  setTimeout(() => { copied.value = null; }, 2000);
}
</script>

<style scoped>
.api-docs { display: flex; flex-direction: column; gap: 12px; }

.api-example {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 10px 12px;
}

.example-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.example-title {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}
</style>

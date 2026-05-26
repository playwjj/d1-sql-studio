<template>
  <div ref="editorEl" class="sql-editor" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { highlightSelectionMatches } from '@codemirror/search';
import { sql } from '@codemirror/lang-sql';
import { autocompletion, type CompletionContext } from '@codemirror/autocomplete';

const props = defineProps<{
  modelValue: string;
  tables?: string[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  execute: [];
}>();

const editorEl = ref<HTMLDivElement>();
let view: EditorView | null = null;

function buildCompletions(tables: string[]) {
  return autocompletion({
    override: [(ctx: CompletionContext) => {
      const word = ctx.matchBefore(/\w*/);
      if (!word || (word.from === word.to && !ctx.explicit)) return null;
      return {
        from: word.from,
        options: tables.map(t => ({ label: t, type: 'class', detail: 'table' })),
      };
    }],
  });
}

function buildState(doc: string, tables: string[]) {
  return EditorState.create({
    doc,
    extensions: [
      lineNumbers(),
      history(),
      bracketMatching(),
      indentOnInput(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      syntaxHighlighting(defaultHighlightStyle),
      sql(),
      buildCompletions(tables),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        indentWithTab,
        { key: 'Ctrl-Enter', mac: 'Mod-Enter', run: () => { emit('execute'); return true; } },
      ]),
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          emit('update:modelValue', update.state.doc.toString());
        }
      }),
      EditorView.theme({
        '&': { fontSize: '13px', height: '100%' },
        '.cm-scroller': { fontFamily: '"JetBrains Mono", "Fira Code", monospace', overflow: 'auto' },
        '.cm-content': { padding: '8px 0' },
        '.cm-line': { padding: '0 12px' },
        '.cm-focused': { outline: 'none' },
      }),
    ],
  });
}

onMounted(() => {
  if (!editorEl.value) return;
  view = new EditorView({
    state: buildState(props.modelValue, props.tables ?? []),
    parent: editorEl.value,
  });
});

onUnmounted(() => {
  view?.destroy();
  view = null;
});

// Sync external value changes to editor
watch(() => props.modelValue, (val) => {
  if (!view) return;
  if (view.state.doc.toString() !== val) {
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: val } });
  }
});

// Rebuild completions when table list changes
watch(() => (props.tables ?? []).length, () => {
  if (!view || !editorEl.value) return;
  const doc = view.state.doc.toString();
  view.destroy();
  view = new EditorView({
    state: buildState(doc, props.tables ?? []),
    parent: editorEl.value,
  });
});
</script>

<style scoped>
.sql-editor {
  height: 100%;
  border-bottom: 1px solid #dde1eb;
}

:deep(.cm-editor) {
  height: 100%;
}
</style>

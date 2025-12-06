import { useEffect, useRef } from 'preact/hooks';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { sql } from '@codemirror/lang-sql';
import { autocompletion } from '@codemirror/autocomplete';
import { defaultKeymap, historyKeymap, history } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute?: () => void;
  tables?: string[];
}

export function SqlEditor({ value, onChange, onExecute, tables = [] }: SqlEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Create autocomplete completions for table names
    const tableCompletions = tables.map(table => ({
      label: table,
      type: 'table',
      boost: 2
    }));

    const customCompletions = (context: any) => {
      const word = context.matchBefore(/\w*/);
      if (!word || (word.from === word.to && !context.explicit)) return null;

      return {
        from: word.from,
        options: tableCompletions
      };
    };

    // Custom keymap for execution
    const customKeymap = keymap.of([
      {
        key: 'Ctrl-Enter',
        mac: 'Cmd-Enter',
        run: () => {
          if (onExecute) {
            onExecute();
            return true;
          }
          return false;
        }
      },
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap
    ]);

    // Editor theme
    const editorTheme = EditorView.theme({
      '&': {
        fontSize: '14px',
        border: '2px solid var(--border)',
        borderRadius: '8px',
        backgroundColor: 'var(--card-bg)',
        fontFamily: 'Monaco, Menlo, "Courier New", monospace'
      },
      '.cm-content': {
        padding: '10px 0',
        minHeight: '200px',
        caretColor: 'var(--primary)'
      },
      '.cm-line': {
        padding: '0 12px',
        lineHeight: '1.6'
      },
      '.cm-gutters': {
        backgroundColor: 'var(--bg)',
        borderRight: '1px solid var(--border)',
        color: 'var(--text-light)',
        paddingRight: '8px'
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'var(--hover-bg)',
        color: 'var(--primary)'
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(129, 140, 248, 0.05)'
      },
      '.cm-selectionMatch': {
        backgroundColor: 'rgba(129, 140, 248, 0.2)'
      },
      '.cm-focused .cm-cursor': {
        borderLeftColor: 'var(--primary)',
        borderLeftWidth: '2px'
      },
      '.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: 'rgba(129, 140, 248, 0.3)'
      },
      '&.cm-focused': {
        outline: 'none',
        borderColor: 'var(--primary)',
        boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
      }
    });

    // Create editor state
    const startState = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        history(),
        bracketMatching(),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle),
        highlightSelectionMatches(),
        sql(),
        autocompletion({
          override: tables.length > 0 ? [customCompletions] : []
        }),
        customKeymap,
        editorTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        })
      ]
    });

    // Create editor view
    const view = new EditorView({
      state: startState,
      parent: editorRef.current
    });

    viewRef.current = view;

    // Cleanup
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [tables.length]); // Only recreate if tables change

  // Update editor content when value changes externally
  useEffect(() => {
    if (viewRef.current) {
      const currentValue = viewRef.current.state.doc.toString();
      if (currentValue !== value) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: value
          }
        });
      }
    }
  }, [value]);

  return <div ref={editorRef} />;
}

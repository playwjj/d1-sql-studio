interface KeyboardShortcutsProps {
  onClose: () => void;
}

interface Shortcut {
  keys: string;
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: 'Ctrl/Cmd + Enter', description: 'Execute query' },
  { keys: 'Ctrl/Cmd + K', description: 'Format SQL' },
  { keys: 'Ctrl/Cmd + H', description: 'Show query history' },
  { keys: 'Ctrl/Cmd + /', description: 'Toggle comment' },
  { keys: 'Ctrl/Cmd + F', description: 'Find in query' },
  { keys: 'Ctrl/Cmd + G', description: 'Find next' },
  { keys: 'Ctrl/Cmd + Shift + G', description: 'Find previous' },
  { keys: 'Ctrl/Cmd + Z', description: 'Undo' },
  { keys: 'Ctrl/Cmd + Shift + Z', description: 'Redo' },
  { keys: 'Ctrl/Cmd + A', description: 'Select all' },
  { keys: 'Ctrl/Cmd + D', description: 'Delete line' },
  { keys: 'Alt + Up/Down', description: 'Move line up/down' },
  { keys: 'Tab', description: 'Indent' },
  { keys: 'Shift + Tab', description: 'Outdent' },
];

export function KeyboardShortcuts({ onClose }: KeyboardShortcutsProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⌨️ Keyboard Shortcuts</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 16px;">
            {shortcuts.map((shortcut, index) => (
              <>
                <div
                  key={`key-${index}`}
                  style="padding: 10px 14px; background: var(--bg); border-radius: 6px; font-family: Monaco, Menlo, 'Courier New', monospace; font-size: 13px; font-weight: 600; color: var(--primary); text-align: center; border: 1px solid var(--border);"
                >
                  {shortcut.keys}
                </div>
                <div
                  key={`desc-${index}`}
                  style="padding: 10px 0; display: flex; align-items: center; color: var(--text-secondary); font-size: 14px;"
                >
                  {shortcut.description}
                </div>
              </>
            ))}
          </div>

          <div style="margin-top: 24px; padding: 16px; background: var(--bg); border-radius: 8px; border-left: 3px solid var(--info);">
            <p style="margin: 0; color: var(--text-secondary); font-size: 14px; line-height: 1.6;">
              <strong style="color: var(--text);">Tip:</strong> On macOS, use Cmd instead of Ctrl. Most shortcuts work the same across platforms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

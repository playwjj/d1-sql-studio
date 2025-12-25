import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { ApiClient } from '../../lib/api';
import { Button, Alert } from '../shared';
import { useNotification } from '../../contexts/NotificationContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useExport } from '../../hooks/useExport';
import { QueryHistoryManager } from '../../lib/queryHistory';
import { QueryResult } from '../../types';
import { SqlEditor } from './SqlEditor';
import { ResultsTable } from './ResultsTable';
import { QueryHistory } from './QueryHistory';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { format } from 'sql-formatter';

interface QueryEditorProps {
  apiClient: ApiClient;
}

export function QueryEditor({ apiClient }: QueryEditorProps) {
  const { showToast } = useNotification();
  const [sql, setSql] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Extract table name from SQL for exports
  const tableName = sql.match(/FROM\s+(\w+)/i)?.[1] || 'query_results';

  // Export functionality with dynamic table name
  const { handleExportCSV, handleExportJSON, handleCopySQLInserts } = useExport({
    tableName: 'query_results',
    onSuccess: () => setShowExportMenu(false),
  });

  // Click outside to close export menu
  useClickOutside(exportMenuRef, () => setShowExportMenu(false), showExportMenu);

  const loadTables = useCallback(async () => {
    try {
      const response = await apiClient.listTables();
      if (response.success && response.data && Array.isArray(response.data)) {
        const tableNames = response.data.map((table: any) => table.name);
        setTables(tableNames);
      }
    } catch (err) {
      console.error('Failed to load tables:', err);
    }
  }, [apiClient]);

  // Load tables for autocomplete
  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const executeQuery = useCallback(async () => {
    if (!sql.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    const startTime = performance.now();

    try {
      const response = await apiClient.executeQuery(sql);
      const duration = `${(performance.now() - startTime).toFixed(2)}ms`;

      if (response.success) {
        setResult(response.data as QueryResult);

        // Save to history
        QueryHistoryManager.saveQuery(
          sql,
          true,
          (response.data as any)?.results?.length || 0,
          duration
        );

        showToast({
          message: `Query executed successfully in ${duration}`,
          variant: 'success'
        });
      } else {
        throw new Error(response.error);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to execute query';
      setError(errorMsg);

      // Save failed query to history
      QueryHistoryManager.saveQuery(sql, false, undefined, undefined, errorMsg);

      showToast({
        message: errorMsg,
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  }, [sql, apiClient, showToast]);

  const formatSQL = useCallback(() => {
    if (!sql.trim()) {
      showToast({ message: 'No SQL to format', variant: 'warning' });
      return;
    }

    try {
      const formatted = format(sql, {
        language: 'sqlite',
        tabWidth: 2,
        keywordCase: 'upper',
        linesBetweenQueries: 2,
      });
      setSql(formatted);
      showToast({ message: 'SQL formatted successfully', variant: 'success' });
    } catch (err: any) {
      showToast({ message: 'Failed to format SQL: ' + err.message, variant: 'danger' });
    }
  }, [sql, setSql, showToast]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K - Format SQL
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        formatSQL();
      }
      // Ctrl/Cmd + H - Show history
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowHistory(true);
      }
      // Ctrl/Cmd + ? - Show shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === '?') {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formatSQL]);

  return (
    <div>
      <Alert variant="info">
        <strong>🔒 Security Notice</strong>
        <p style="margin: 8px 0 0 0; line-height: 1.6;">
          <strong>Allowed:</strong> SELECT, INSERT, UPDATE, DELETE, PRAGMA<br/>
          <strong>Blocked:</strong> DROP, CREATE, ALTER, TRUNCATE (use dedicated UI features for schema changes)
        </p>
      </Alert>

      <div className="card">
        <div className="card-header">
          <h3>SQL Query Editor</h3>
          <div style="display: flex; gap: 10px;">
            <Button
              onClick={() => setShowShortcuts(true)}
              variant="secondary"
              className="btn-sm"
              title="Keyboard Shortcuts"
            >
              ⌨️
            </Button>
            <Button
              onClick={() => setShowHistory(true)}
              variant="secondary"
              className="btn-sm"
              title="Query History (Ctrl+H)"
            >
              📜 History
            </Button>
            <Button
              onClick={formatSQL}
              variant="secondary"
              className="btn-sm"
              title="Format SQL (Ctrl+K)"
            >
              ✨ Format
            </Button>
            <Button
              onClick={executeQuery}
              variant="primary"
              disabled={loading}
            >
              {loading ? '⏳ Executing...' : '⚡ Execute (Ctrl+Enter)'}
            </Button>
          </div>
        </div>

        <div className="form-group" style="margin: 0;">
          <SqlEditor
            value={sql}
            onChange={setSql}
            onExecute={executeQuery}
            tables={tables}
          />
        </div>
      </div>

      {error && (
        <div className="card">
          <Alert variant="danger">
            <strong>Error:</strong> {error}
          </Alert>
        </div>
      )}

      {result && (
        <div className="card">
          <div className="card-header">
            <h3>Results</h3>
            <div style="display: flex; gap: 10px; align-items: center;">
              <span className="badge badge-success">
                {result.results?.length || 0} rows
              </span>
              {result.results && result.results.length > 0 && (
                <div ref={exportMenuRef} style="position: relative;">
                  <Button
                    variant="primary"
                    className="btn-sm"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                  >
                    📥 Export
                  </Button>
                  {showExportMenu && (
                    <div className="export-dropdown">
                      <button className="export-dropdown-item" onClick={() => handleExportCSV(result.results, 'query_results.csv')}>
                        <span className="export-icon">📄</span>
                        <div>
                          <div className="export-title">Export as CSV</div>
                          <div className="export-desc">Download results in CSV format</div>
                        </div>
                      </button>
                      <button className="export-dropdown-item" onClick={() => handleExportJSON(result.results, 'query_results.json')}>
                        <span className="export-icon">📋</span>
                        <div>
                          <div className="export-title">Export as JSON</div>
                          <div className="export-desc">Download results in JSON format</div>
                        </div>
                      </button>
                      <button className="export-dropdown-item" onClick={() => handleCopySQLInserts(result.results, tableName)}>
                        <span className="export-icon">💾</span>
                        <div>
                          <div className="export-title">Copy as SQL INSERT</div>
                          <div className="export-desc">Copy INSERT statements to clipboard</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {result.results && result.results.length > 0 ? (
            <ResultsTable results={result.results} />
          ) : (
            <Alert variant="success">Query executed successfully!</Alert>
          )}

          {result.meta && (
            <div style="padding: 16px; background: var(--bg); border-top: 1px solid var(--border);">
              <code style="font-size: 12px;">
                Duration: {result.meta.duration || 'N/A'} |
                Changes: {result.meta.changes || 0} |
                Last Row ID: {result.meta.last_row_id || 'N/A'}
              </code>
            </div>
          )}
        </div>
      )}

      {showHistory && (
        <QueryHistory
          onSelectQuery={(query) => setSql(query)}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showShortcuts && (
        <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  );
}

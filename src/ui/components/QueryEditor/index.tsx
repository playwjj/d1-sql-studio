import { useState, useRef } from 'preact/hooks';
import { ApiClient } from '../../lib/api';
import { Button, Alert } from '../shared';
import { exportToCSV, exportToJSON, copySQLInserts } from '../../lib/exportUtils';
import { useNotification } from '../../contexts/NotificationContext';

interface QueryEditorProps {
  apiClient: ApiClient;
}

export function QueryEditor({ apiClient }: QueryEditorProps) {
  const { showToast } = useNotification();
  const [sql, setSql] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const executeQuery = async () => {
    if (!sql.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const response = await apiClient.executeQuery(sql);
      if (response.success) {
        setResult(response.data);
      } else {
        throw new Error(response.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to execute query');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  };

  const handleExportCSV = () => {
    try {
      if (!result?.results || result.results.length === 0) {
        showToast({ message: 'No results to export', variant: 'warning' });
        return;
      }
      exportToCSV(result.results, 'query_results.csv');
      showToast({ message: 'Results exported to CSV successfully', variant: 'success' });
      setShowExportMenu(false);
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to export CSV', variant: 'danger' });
    }
  };

  const handleExportJSON = () => {
    try {
      if (!result?.results || result.results.length === 0) {
        showToast({ message: 'No results to export', variant: 'warning' });
        return;
      }
      exportToJSON(result.results, 'query_results.json');
      showToast({ message: 'Results exported to JSON successfully', variant: 'success' });
      setShowExportMenu(false);
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to export JSON', variant: 'danger' });
    }
  };

  const handleCopySQLInserts = async () => {
    try {
      if (!result?.results || result.results.length === 0) {
        showToast({ message: 'No results to copy', variant: 'warning' });
        return;
      }
      // Extract table name from SQL if possible, otherwise use 'table_name'
      const tableName = sql.match(/FROM\s+(\w+)/i)?.[1] || 'query_results';
      await copySQLInserts(result.results, tableName);
      showToast({ message: 'SQL INSERT statements copied to clipboard', variant: 'success' });
      setShowExportMenu(false);
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to copy SQL', variant: 'danger' });
    }
  };

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
          <Button
            onClick={executeQuery}
            variant="primary"
            disabled={loading}
          >
            {loading ? '⏳ Executing...' : '⚡ Execute (Ctrl+Enter)'}
          </Button>
        </div>

        <div className="form-group">
          <textarea
            className="form-control"
            placeholder="Enter your SQL query here...&#10;&#10;Examples:&#10;SELECT * FROM users LIMIT 10;&#10;UPDATE users SET name = 'John' WHERE id = 1;&#10;DELETE FROM users WHERE id = 5;"
            value={sql}
            onInput={(e) => setSql((e.target as HTMLTextAreaElement).value)}
            onKeyDown={handleKeyDown}
            rows={10}
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
                      <button className="export-dropdown-item" onClick={handleExportCSV}>
                        <span className="export-icon">📄</span>
                        <div>
                          <div className="export-title">Export as CSV</div>
                          <div className="export-desc">Download results in CSV format</div>
                        </div>
                      </button>
                      <button className="export-dropdown-item" onClick={handleExportJSON}>
                        <span className="export-icon">📋</span>
                        <div>
                          <div className="export-title">Export as JSON</div>
                          <div className="export-desc">Download results in JSON format</div>
                        </div>
                      </button>
                      <button className="export-dropdown-item" onClick={handleCopySQLInserts}>
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
            <div style="overflow-x: auto;">
              <table className="data-table">
                <thead>
                  <tr>
                    {Object.keys(result.results[0]).map(col => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((row: any, idx: number) => (
                    <tr key={idx}>
                      {Object.values(row).map((val: any, i: number) => (
                        <td key={i}>
                          {val === null ? (
                            <span style="color: var(--text-light); font-style: italic;">NULL</span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    </div>
  );
}

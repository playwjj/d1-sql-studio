import { useState, useEffect } from 'preact/hooks';
import { ApiClient } from '../../lib/api';
import { Button } from '../shared';
import { Alert } from '../shared/Alert';

interface Table {
  name: string;
  type: string;
}

interface TablesListProps {
  apiClient: ApiClient;
  onTableSelect: (tableName: string) => void;
  onCreateTable: () => void;
}

export function TablesList({ apiClient, onTableSelect, onCreateTable }: TablesListProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.listTables();
      if (result.success) {
        const tablesArray = Array.isArray(result.data) ? result.data : [];
        setTables(tablesArray);
      } else if (result.error === 'DATABASE_NOT_BOUND') {
        setError('DATABASE_NOT_BOUND');
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tableName: string) => {
    if (!confirm(`Are you sure you want to delete table "${tableName}"?`)) {
      return;
    }

    try {
      const result = await apiClient.deleteTable(tableName);
      if (result.success) {
        alert('Table deleted successfully!');
        loadTables();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading tables...</p>
      </div>
    );
  }

  if (error === 'DATABASE_NOT_BOUND') {
    return (
      <div>
        <Alert variant="warning">
          <strong>Database Not Bound</strong><br/>
          No D1 database is bound to this Worker. Please bind a database in Cloudflare Dashboard.
        </Alert>
        <div className="db-setup-guide" style="margin-top: 20px; padding: 20px; background: var(--card-bg); border-radius: 8px; border-left: 4px solid var(--warning);">
          <h4 style="color: var(--warning); margin-bottom: 15px;">📚 How to Bind D1 Database</h4>
          <p>Please follow these steps:</p>
          <ol style="margin-left: 20px; line-height: 1.8;">
            <li>Login to <a href="https://dash.cloudflare.com/" target="_blank">Cloudflare Dashboard</a></li>
            <li>Go to <strong>Workers & Pages</strong></li>
            <li>Click your Worker project (<code>d1-sql-studio</code>)</li>
            <li>Go to <strong>Settings</strong> &gt; <strong>Bindings</strong></li>
            <li>In <strong>D1 Database Bindings</strong> click <strong>Add binding</strong></li>
            <li>Set Variable name: <code>DB</code> and select/create your database</li>
            <li>Click <strong>Save</strong></li>
            <li>Refresh this page</li>
          </ol>
        </div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (tables.length === 0) {
    return (
      <div>
        <Alert variant="info">No tables found in the database.</Alert>
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">No Tables Yet</div>
          <div className="empty-state-subtext">Create your first table to get started</div>
          <Button onClick={onCreateTable} variant="primary">
            ➕ Create Table
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card-header">
        <h3>Tables ({tables.length})</h3>
        <Button onClick={onCreateTable} variant="primary">
          ➕ Create Table
        </Button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th style="width: 200px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tables.map((table) => (
            <tr key={table.name}>
              <td>
                <strong>{table.name}</strong>
              </td>
              <td>
                <span className="badge badge-primary">{table.type}</span>
              </td>
              <td>
                <div className="table-actions">
                  <Button
                    onClick={() => onTableSelect(table.name)}
                    variant="primary"
                    className="btn-sm"
                  >
                    📝 Browse Data
                  </Button>
                  <Button
                    onClick={() => handleDelete(table.name)}
                    variant="danger"
                    className="btn-sm"
                  >
                    🗑️ Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

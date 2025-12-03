import { useState, useEffect } from 'preact/hooks';
import { ApiClient } from '../../lib/api';
import { Button, Alert } from '../shared';

interface DataBrowserProps {
  apiClient: ApiClient;
  tableName: string;
}

export function DataBrowser({ apiClient, tableName }: DataBrowserProps) {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  useEffect(() => {
    loadData();
  }, [tableName, page]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.getTableData(tableName, page, limit);
      if (result.success && result.data) {
        const dataArray = Array.isArray(result.data) ? result.data : [];
        setData(dataArray);
        setTotal(result.meta?.total || 0);
        if (dataArray.length > 0) {
          setColumns(Object.keys(dataArray[0]));
        }
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading data...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📝</div>
        <div className="empty-state-text">No Data</div>
        <div className="empty-state-subtext">This table is empty</div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="card-header">
        <h3>{tableName} ({total} rows)</h3>
        <div>
          <Button variant="success" className="btn-sm">
            ➕ Add Row
          </Button>
        </div>
      </div>

      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col}>{col}</th>
              ))}
              <th style="width: 150px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {columns.map(col => (
                  <td key={col}>
                    {row[col] === null ? (
                      <span style="color: var(--text-light); font-style: italic;">NULL</span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
                <td>
                  <div className="table-actions">
                    <button className="btn btn-primary btn-sm">Edit</button>
                    <button className="btn btn-danger btn-sm">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <Button
          variant="secondary"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          ← Previous
        </Button>
        <span className="pagination-info">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}

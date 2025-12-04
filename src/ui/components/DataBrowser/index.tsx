import { useState, useEffect } from 'preact/hooks';
import { ApiClient } from '../../lib/api';
import { Button, Alert } from '../shared';
import { AddRowModal } from './AddRowModal';
import { EditRowModal } from './EditRowModal';
import { ApiDocumentation } from './ApiDocumentation';
import { useNotification } from '../../contexts/NotificationContext';

interface DataBrowserProps {
  apiClient: ApiClient;
  tableName: string;
  apiKey?: string;
}

export function DataBrowser({ apiClient, tableName, apiKey }: DataBrowserProps) {
  const { showToast, showConfirm } = useNotification();
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
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

  const handleAddSuccess = () => {
    setShowAddModal(false);
    loadData();
  };

  const handleEditClick = (row: any) => {
    setEditingRow(row);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingRow(null);
    loadData();
  };

  const handleDelete = async (row: any) => {
    const confirmed = await showConfirm({
      title: 'Delete Row',
      message: 'Are you sure you want to delete this row?',
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    try {
      const primaryKey = columns[0];
      const id = row[primaryKey];
      const result = await apiClient.deleteRow(tableName, id);
      if (result.success) {
        showToast({ message: 'Row deleted successfully', variant: 'success' });
        loadData();
      } else {
        showToast({ message: result.error || 'Failed to delete row', variant: 'danger' });
      }
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to delete row', variant: 'danger' });
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
          <Button variant="success" className="btn-sm" onClick={() => setShowAddModal(true)}>
            ➕ Add Row
          </Button>
        </div>
      </div>

      <ApiDocumentation
        tableName={tableName}
        apiUrl={window.location.origin}
        apiKey={apiKey || 'your-api-key'}
        apiClient={apiClient}
      />

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
                    <button className="btn btn-primary btn-sm" onClick={() => handleEditClick(row)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row)}>Delete</button>
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

      <AddRowModal
        isOpen={showAddModal}
        apiClient={apiClient}
        tableName={tableName}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      {editingRow && (
        <EditRowModal
          isOpen={showEditModal}
          apiClient={apiClient}
          tableName={tableName}
          rowData={editingRow}
          onClose={() => {
            setShowEditModal(false);
            setEditingRow(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

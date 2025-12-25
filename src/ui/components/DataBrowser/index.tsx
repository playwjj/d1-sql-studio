import { useState, useEffect, useRef } from 'preact/hooks';
import { ApiClient } from '../../lib/api';
import { Button, Alert } from '../shared';
import { AddRowModal } from './AddRowModal';
import { EditRowModal } from './EditRowModal';
import { ApiDocumentation } from './ApiDocumentation';
import { useNotification } from '../../contexts/NotificationContext';
import { exportToCSV, exportToJSON, copySQLInserts } from '../../lib/exportUtils';
import { useTableSchema } from '../../hooks/useTableSchema';

interface DataBrowserProps {
  apiClient: ApiClient;
  tableName: string;
  apiKey?: string;
}

export function DataBrowser({ apiClient, tableName, apiKey }: DataBrowserProps) {
  const { showToast, showConfirm } = useNotification();
  const { schema } = useTableSchema(apiClient, tableName);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const limit = 50;

  // Update columns when schema loads
  useEffect(() => {
    if (schema && schema.length > 0) {
      setColumns(schema.map(col => col.name));
    }
  }, [schema]);

  // Reset page when search or sort changes, BEFORE loading data
  useEffect(() => {
    // Only reset if page is not already 1
    if (page !== 1) {
      setPage(1);
      return; // Don't load data here, let the next effect handle it
    }
    // If page is already 1, load data immediately
    loadData();
  }, [tableName, sortBy, sortOrder, search]);

  // Load data when page changes (after reset or manual navigation)
  useEffect(() => {
    // Only trigger if page > 1 (page 1 is handled by previous effect)
    if (page > 1) {
      loadData();
    }
  }, [page]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.getTableData(
        tableName,
        page,
        limit,
        sortBy || undefined,
        sortOrder,
        search || undefined
      );
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

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleSearchSubmit = (e: Event) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleSearchClear = () => {
    setSearchInput('');
    setSearch('');
  };

  const handleExportCSV = () => {
    try {
      exportToCSV(data, `${tableName}_export.csv`);
      showToast({ message: 'Data exported to CSV successfully', variant: 'success' });
      setShowExportMenu(false);
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to export CSV', variant: 'danger' });
    }
  };

  const handleExportJSON = () => {
    try {
      exportToJSON(data, `${tableName}_export.json`);
      showToast({ message: 'Data exported to JSON successfully', variant: 'success' });
      setShowExportMenu(false);
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to export JSON', variant: 'danger' });
    }
  };

  const handleCopySQLInserts = async () => {
    try {
      await copySQLInserts(data, tableName);
      showToast({ message: 'SQL INSERT statements copied to clipboard', variant: 'success' });
      setShowExportMenu(false);
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to copy SQL', variant: 'danger' });
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
      <div>
        <div className="card-header">
          <h3>{tableName} (0 rows)</h3>
          <div style="display: flex; gap: 10px;">
            <Button variant="secondary" className="btn-sm" onClick={() => loadData()}>
              🔄 Refresh
            </Button>
            <Button variant="success" className="btn-sm" onClick={() => setShowAddModal(true)}>
              ➕ Add Row
            </Button>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-text">No Data</div>
          <div className="empty-state-subtext">This table is empty. Click "Add Row" to add your first row.</div>
        </div>

        <AddRowModal
          isOpen={showAddModal}
          apiClient={apiClient}
          tableName={tableName}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="card-header">
        <h3>{tableName} ({total} rows)</h3>
        <div style="display: flex; gap: 10px; position: relative;">
          <Button variant="secondary" className="btn-sm" onClick={() => loadData()}>
            🔄 Refresh
          </Button>
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
                    <div className="export-desc">Download data in CSV format</div>
                  </div>
                </button>
                <button className="export-dropdown-item" onClick={handleExportJSON}>
                  <span className="export-icon">📋</span>
                  <div>
                    <div className="export-title">Export as JSON</div>
                    <div className="export-desc">Download data in JSON format</div>
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
          <Button variant="success" className="btn-sm" onClick={() => setShowAddModal(true)}>
            ➕ Add Row
          </Button>
        </div>
      </div>

      <div className="card-body">
        <form onSubmit={handleSearchSubmit} style="margin-bottom: 1rem;">
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <input
              type="text"
              placeholder="Search in text columns..."
              value={searchInput}
              onInput={(e) => setSearchInput((e.target as HTMLInputElement).value)}
              style="flex: 1; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-color);"
            />
            <Button type="submit" variant="primary">
              🔍 Search
            </Button>
            {search && (
              <Button type="button" variant="secondary" onClick={handleSearchClear}>
                ✕ Clear
              </Button>
            )}
          </div>
          {search && (
            <div style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-light);">
              Showing results for: "{search}"
            </div>
          )}
        </form>
      </div>

      <ApiDocumentation
        tableName={tableName}
        apiUrl={window.location.origin}
        apiKey={apiKey || 'your-api-key'}
        apiClient={apiClient}
      />

      <div style="overflow-x: auto;">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  style="cursor: pointer; user-select: none;"
                  title={`Click to sort by ${col}`}
                >
                  {col}
                  {sortBy === col && (
                    <span style="margin-left: 0.25rem;">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
              <th style="width: 120px;">Actions</th>
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

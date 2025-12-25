import { useState, useEffect } from 'preact/hooks';
import { ApiClient } from '../../lib/api';
import { Button, Alert } from '../shared';
import { useNotification } from '../../contexts/NotificationContext';
import { Plus, Trash2, Info } from 'lucide-preact';

interface IndexInfo {
  seq: number;
  name: string;
  unique: number;
  origin: string;
  partial: number;
}

interface IndexColumn {
  seqno: number;
  cid: number;
  name: string;
}

interface IndexWithColumns extends IndexInfo {
  columns?: IndexColumn[];
}

interface IndexManagementProps {
  apiClient: ApiClient;
  tableName: string;
  columns: Array<{ name: string }>;
}

export function IndexManagement({ apiClient, tableName, columns }: IndexManagementProps) {
  const { showToast, showConfirm } = useNotification();
  const [indexes, setIndexes] = useState<IndexWithColumns[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create index form
  const [indexName, setIndexName] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isUnique, setIsUnique] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadIndexes();
  }, [tableName]);

  const loadIndexes = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.listIndexes(tableName);
      if (result.success && Array.isArray(result.data)) {
        const indexesData: IndexWithColumns[] = result.data;

        // Load columns for each index
        for (const index of indexesData) {
          try {
            const colResult = await apiClient.getIndexColumns(tableName, index.name);
            if (colResult.success && Array.isArray(colResult.data)) {
              index.columns = colResult.data;
            }
          } catch (err) {
            console.error(`Failed to load columns for index ${index.name}:`, err);
          }
        }

        setIndexes(indexesData);
      } else {
        throw new Error(result.error || 'Failed to load indexes');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load indexes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIndex = async () => {
    const errors: Record<string, string> = {};

    if (!indexName.trim()) {
      errors.indexName = 'Index name is required';
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(indexName)) {
      errors.indexName = 'Index name must start with a letter or underscore';
    }

    if (selectedColumns.length === 0) {
      errors.columns = 'At least one column must be selected';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const result = await apiClient.createIndex(tableName, indexName, selectedColumns, isUnique);
      if (result.success) {
        showToast({ message: 'Index created successfully', variant: 'success' });
        setShowCreateForm(false);
        resetForm();
        loadIndexes();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to create index', variant: 'danger' });
    }
  };

  const handleDeleteIndex = async (indexName: string, origin: string) => {
    // Prevent deletion of PRIMARY KEY and UNIQUE constraint indexes
    if (origin === 'pk') {
      showToast({ message: 'Cannot delete PRIMARY KEY index', variant: 'warning' });
      return;
    }

    if (origin === 'u') {
      showToast({ message: 'Cannot delete UNIQUE constraint index. Drop the constraint instead.', variant: 'warning' });
      return;
    }

    const confirmed = await showConfirm({
      title: 'Delete Index',
      message: `Are you sure you want to delete index "${indexName}"?`,
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    try {
      const result = await apiClient.dropIndex(tableName, indexName);
      if (result.success) {
        showToast({ message: 'Index deleted successfully', variant: 'success' });
        loadIndexes();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to delete index', variant: 'danger' });
    }
  };

  const resetForm = () => {
    setIndexName('');
    setSelectedColumns([]);
    setIsUnique(false);
    setFormErrors({});
  };

  const toggleColumn = (columnName: string) => {
    if (selectedColumns.includes(columnName)) {
      setSelectedColumns(selectedColumns.filter(c => c !== columnName));
    } else {
      setSelectedColumns([...selectedColumns, columnName]);
    }
  };

  const getOriginLabel = (origin: string) => {
    switch (origin) {
      case 'pk': return 'PRIMARY KEY';
      case 'u': return 'UNIQUE';
      case 'c': return 'INDEX';
      default: return origin;
    }
  };

  if (loading) {
    return <div>Loading indexes...</div>;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <div className="card-header" style="margin: -28px -28px 20px -28px; padding: 20px 28px;">
        <h4 style="margin: 0;">Indexes</h4>
        <Button
          variant={showCreateForm ? 'secondary' : 'primary'}
          className="btn-sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? (
            <>
              <Trash2 size={14} />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Plus size={14} />
              <span>Create Index</span>
            </>
          )}
        </Button>
      </div>

      {showCreateForm && (
        <div style="background: var(--bg); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--border);">
          <h5 style="margin-top: 0;">Create New Index</h5>

          <div className="form-group">
            <label>
              Index Name
              <span style="color: var(--danger); margin-left: 4px;">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={indexName}
              onInput={(e) => setIndexName((e.target as HTMLInputElement).value)}
              placeholder="idx_column_name"
            />
            {formErrors.indexName && (
              <div className="form-error">
                <span className="form-error-icon">⚠</span>
                <span className="form-error-message">{formErrors.indexName}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Columns to Index *</label>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px;">
              {columns.map(col => (
                <label
                  key={col.name}
                  className="checkbox-group"
                  style="background: var(--card-bg); padding: 10px 14px; border-radius: 8px; border: 2px solid var(--border); cursor: pointer; user-select: none;"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(col.name)}
                    onChange={() => toggleColumn(col.name)}
                  />
                  <span>{col.name}</span>
                </label>
              ))}
            </div>
            {formErrors.columns && (
              <div className="form-error">{formErrors.columns}</div>
            )}
            {selectedColumns.length > 0 && (
              <div style="margin-top: 8px; font-size: 13px; color: var(--text-light);">
                Selected: {selectedColumns.join(', ')}
              </div>
            )}
          </div>

          <div className="checkbox-group" style="margin: 16px 0;">
            <input
              type="checkbox"
              id="unique-index"
              checked={isUnique}
              onChange={(e) => setIsUnique((e.target as HTMLInputElement).checked)}
            />
            <label htmlFor="unique-index">Create UNIQUE index</label>
          </div>

          <div style="display: flex; gap: 10px;">
            <Button variant="primary" onClick={handleCreateIndex}>
              <Plus size={14} />
              <span>Create Index</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {indexes.length === 0 ? (
        <div className="empty-state" style="padding: 40px 20px;">
          <div className="empty-state-icon"><Info size={48} style="opacity: 0.5;" /></div>
          <div className="empty-state-text">No Indexes</div>
          <div className="empty-state-subtext">
            Create indexes to improve query performance on frequently searched columns
          </div>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Columns</th>
              <th>Type</th>
              <th style="width: 100px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            {indexes.map((index) => (
              <tr key={index.name}>
                <td>
                  <strong>{index.name}</strong>
                </td>
                <td>
                  {index.columns && index.columns.length > 0
                    ? index.columns.map(c => c.name).join(', ')
                    : 'Loading...'}
                </td>
                <td>
                  <span className={`badge ${index.unique ? 'badge-warning' : 'badge-primary'}`}>
                    {getOriginLabel(index.origin)}
                    {index.unique ? ' (UNIQUE)' : ''}
                  </span>
                </td>
                <td>
                  {index.origin === 'c' && (
                    <Button
                      variant="danger"
                      className="btn-sm"
                      onClick={() => handleDeleteIndex(index.name, index.origin)}
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </Button>
                  )}
                  {(index.origin === 'pk' || index.origin === 'u') && (
                    <span style="color: var(--text-light); font-size: 12px;">System</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

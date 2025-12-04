import { useState, useEffect } from 'preact/hooks';
import { Modal, Button, Alert } from '../shared';
import { ApiClient } from '../../lib/api';
import { useNotification } from '../../contexts/NotificationContext';

interface Column {
  name: string;
  type: string;
  notnull: boolean;
  dflt_value: any;
  pk: boolean;
}

interface EditRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiClient: ApiClient;
  tableName: string;
  rowData: Record<string, any>;
  onSuccess: () => void;
}

export function EditRowModal({
  isOpen,
  onClose,
  apiClient,
  tableName,
  rowData,
  onSuccess,
}: EditRowModalProps) {
  const { showToast } = useNotification();
  const [schema, setSchema] = useState<Column[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [primaryKey, setPrimaryKey] = useState<string>('');

  useEffect(() => {
    if (isOpen && rowData) {
      loadSchema();
      setFormData({ ...rowData });
    }
  }, [isOpen, tableName, rowData]);

  const loadSchema = async () => {
    setSchemaLoading(true);
    setError('');
    try {
      const result = await apiClient.getTableSchema(tableName);
      if (result.success && result.data) {
        const columns = Array.isArray(result.data) ? result.data : [];
        setSchema(columns);

        // Find primary key
        const pkColumn = columns.find((col: Column) => col.pk);
        if (pkColumn) {
          setPrimaryKey(pkColumn.name);
        }
      } else {
        throw new Error(result.error || 'Failed to load schema');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load table schema');
    } finally {
      setSchemaLoading(false);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!primaryKey || !rowData[primaryKey]) {
        throw new Error('Cannot identify row: primary key not found');
      }

      // Process form data (exclude primary key from updates)
      const submitData: Record<string, any> = {};

      schema.forEach((col) => {
        // Skip primary key
        if (col.pk) {
          return;
        }

        const value = formData[col.name];

        // Handle empty values
        if (value === '' || value === null) {
          if (col.notnull && col.dflt_value === null) {
            throw new Error(`Field "${col.name}" is required`);
          }
          submitData[col.name] = null;
          return;
        }

        // Type conversion
        if (col.type === 'INTEGER') {
          const num = parseInt(value, 10);
          if (isNaN(num)) {
            throw new Error(`Field "${col.name}" must be a number`);
          }
          submitData[col.name] = num;
        } else if (col.type === 'REAL') {
          const num = parseFloat(value);
          if (isNaN(num)) {
            throw new Error(`Field "${col.name}" must be a number`);
          }
          submitData[col.name] = num;
        } else {
          submitData[col.name] = value;
        }
      });

      const result = await apiClient.updateRow(tableName, rowData[primaryKey], submitData);
      if (result.success) {
        showToast({ message: 'Row updated successfully!', variant: 'success' });
        onSuccess();
        handleClose();
      } else {
        throw new Error(result.error || 'Failed to update row');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update row');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    setError('');
    onClose();
  };

  const updateField = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`✏️ Edit Row in ${tableName}`} size="medium">
      <form onSubmit={handleSubmit}>
        {error && <Alert variant="danger">{error}</Alert>}

        {schemaLoading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading schema...</p>
          </div>
        ) : (
          <div>
            {schema.map((col) => (
              <div key={col.name} className="form-group">
                <label htmlFor={`field-${col.name}`}>
                  {col.name}
                  {!!col.pk && <span style="color: var(--warning); margin-left: 4px;">🔑</span>}
                  {!!col.notnull && !col.pk && <span style="color: var(--danger); margin-left: 4px;">*</span>}
                  <span style="color: var(--text-light); font-size: 12px; margin-left: 8px;">
                    ({col.type})
                  </span>
                </label>
                <input
                  type="text"
                  id={`field-${col.name}`}
                  className="form-control"
                  value={formData[col.name] === null ? '' : formData[col.name]}
                  onInput={(e) => updateField(col.name, (e.target as HTMLInputElement).value)}
                  disabled={col.pk}
                  placeholder={col.pk ? 'Primary key (read-only)' : col.notnull ? 'Required' : 'Optional'}
                  required={col.notnull && col.dflt_value === null && !col.pk}
                  style={col.pk ? 'background: var(--bg); cursor: not-allowed;' : ''}
                />
              </div>
            ))}
          </div>
        )}

        <div className="modal-footer">
          <Button type="button" onClick={handleClose} variant="secondary" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading || schemaLoading}>
            {loading ? '⏳ Updating...' : '✓ Update Row'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

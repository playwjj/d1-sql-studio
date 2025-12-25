import { useState, useEffect } from 'preact/hooks';
import { Modal, Button, Alert } from '../shared';
import { ApiClient } from '../../lib/api';
import { generateUUID } from '../../lib/utils';
import { useNotification } from '../../contexts/NotificationContext';
import { ColumnInfo, RowData } from '../../types';

interface AddRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiClient: ApiClient;
  tableName: string;
  onSuccess: () => void;
}

export function AddRowModal({ isOpen, onClose, apiClient, tableName, onSuccess }: AddRowModalProps) {
  const { showToast } = useNotification();
  const [schema, setSchema] = useState<ColumnInfo[]>([]);
  const [formData, setFormData] = useState<RowData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schemaLoading, setSchemaLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadSchema();
    }
  }, [isOpen, tableName]);

  const loadSchema = async () => {
    setSchemaLoading(true);
    setError('');
    try {
      const result = await apiClient.getTableSchema(tableName);
      if (result.success && result.data) {
        const columns = Array.isArray(result.data) ? result.data : [];
        setSchema(columns);

        // Initialize form data with default values
        const initialData: RowData = {};
        columns.forEach((col) => {
          if (col.dflt_value !== null) {
            initialData[col.name] = col.dflt_value;
          } else {
            initialData[col.name] = '';
          }
        });
        setFormData(initialData);
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
      // Process form data
      const submitData: Record<string, any> = {};

      schema.forEach((col) => {
        const value = formData[col.name];

        // Skip auto-increment primary keys
        if (col.pk && col.type === 'INTEGER' && (value === '' || value === null)) {
          return;
        }

        // Auto-generate UUID for TEXT primary keys if empty
        if (col.pk && col.type === 'TEXT' && (value === '' || value === null)) {
          submitData[col.name] = generateUUID();
          return;
        }

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
          const num = parseInt(String(value ?? ''), 10);
          if (isNaN(num)) {
            throw new Error(`Field "${col.name}" must be a number`);
          }
          submitData[col.name] = num;
        } else if (col.type === 'REAL') {
          const num = parseFloat(String(value ?? ''));
          if (isNaN(num)) {
            throw new Error(`Field "${col.name}" must be a number`);
          }
          submitData[col.name] = num;
        } else {
          submitData[col.name] = value;
        }
      });

      const result = await apiClient.insertRow(tableName, submitData);
      if (result.success) {
        showToast({ message: 'Row added successfully!', variant: 'success' });
        onSuccess();
        handleClose();
      } else {
        throw new Error(result.error || 'Failed to add row');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add row');
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

  const shouldShowField = (col: ColumnInfo): boolean => {
    // Skip auto-increment INTEGER primary keys
    if (col.pk === 1 && col.type === 'INTEGER') {
      return false;
    }
    return true;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`➕ Add Row to ${tableName}`} size="medium">
      <form onSubmit={handleSubmit}>
        {error && <Alert variant="danger">{error}</Alert>}

        {schemaLoading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading schema...</p>
          </div>
        ) : (
          <div>
            {schema.filter(shouldShowField).map((col) => (
              <div key={col.name} className="form-group">
                <label htmlFor={`field-${col.name}`}>
                  {col.name}
                  {col.pk === 1 && <span style="color: var(--warning); margin-left: 4px;">🔑</span>}
                  {col.notnull === 1 && col.pk !== 1 && <span style="color: var(--danger); margin-left: 4px;">*</span>}
                  <span style="color: var(--text-light); font-size: 12px; margin-left: 8px;">
                    ({col.type})
                  </span>
                </label>
                <input
                  type="text"
                  id={`field-${col.name}`}
                  className="form-control"
                  value={String(formData[col.name] ?? '')}
                  onInput={(e) => updateField(col.name, (e.target as HTMLInputElement).value)}
                  placeholder={
                    col.pk === 1 && col.type === 'TEXT'
                      ? 'Leave empty to auto-generate UUID'
                      : col.dflt_value !== null
                      ? `Default: ${col.dflt_value}`
                      : col.notnull === 1
                      ? 'Required'
                      : 'Optional'
                  }
                />
              </div>
            ))}
          </div>
        )}

        <div className="modal-footer">
          <Button type="button" onClick={handleClose} variant="secondary" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={loading || schemaLoading}>
            {loading ? '⏳ Adding...' : '✓ Add Row'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

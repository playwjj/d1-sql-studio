import { useState, useEffect } from 'preact/hooks';
import { ApiClient } from '../../lib/api';
import { Modal, Button, Alert } from '../shared';
import { useNotification } from '../../contexts/NotificationContext';
import { FormField } from '../shared/FormField';

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

interface EditTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiClient: ApiClient;
  tableName: string;
  onSuccess: () => void;
}

type EditMode = 'main' | 'add' | 'rename' | 'renameTable';

export function EditTableModal({ isOpen, onClose, apiClient, tableName, onSuccess }: EditTableModalProps) {
  const { showToast, showConfirm } = useNotification();
  const [mode, setMode] = useState<EditMode>('main');
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Add column form
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('TEXT');
  const [newColumnConstraints, setNewColumnConstraints] = useState('');

  // Rename column form
  const [selectedColumn, setSelectedColumn] = useState('');
  const [renamedColumnName, setRenamedColumnName] = useState('');

  // Rename table form
  const [newTableName, setNewTableName] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      loadSchema();
      resetForms();
    }
  }, [isOpen, tableName]);

  const loadSchema = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.getTableSchema(tableName);
      if (result.success) {
        setColumns(Array.isArray(result.data) ? result.data : []);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load table schema');
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setMode('main');
    setNewColumnName('');
    setNewColumnType('TEXT');
    setNewColumnConstraints('');
    setSelectedColumn('');
    setRenamedColumnName('');
    setNewTableName('');
    setFormErrors({});
  };

  const handleAddColumn = async () => {
    const errors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    if (!newColumnName.trim()) {
      errors.newColumnName = 'Column name is required';
      newTouched.newColumnName = true;
    }

    if (!newColumnType.trim()) {
      errors.newColumnType = 'Column type is required';
      newTouched.newColumnType = true;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setTouched({ ...touched, ...newTouched });
      return;
    }

    setLoading(true);
    setFormErrors({});
    try {
      // Map extended types to SQLite base types
      const typeMap: Record<string, string> = {
        UUID: 'TEXT',
        DATETIME: 'TEXT',
        TIMESTAMP: 'TEXT',
        DATE: 'TEXT',
        TIME: 'TEXT',
        BOOLEAN: 'INTEGER',
        JSON: 'TEXT',
      };
      const mappedType = typeMap[newColumnType.toUpperCase()] || newColumnType;

      const result = await apiClient.addColumn(
        tableName,
        newColumnName.trim(),
        mappedType.trim(),
        newColumnConstraints.trim() || undefined
      );

      if (result.success) {
        showToast({ message: 'Column added successfully!', variant: 'success' });
        onSuccess();
        loadSchema();
        resetForms();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      showToast({ message: `Error: ${err.message}`, variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleDropColumn = async (columnName: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Column',
      message: `Are you sure you want to delete column "${columnName}"? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.dropColumn(tableName, columnName);

      if (result.success) {
        showToast({ message: 'Column deleted successfully!', variant: 'success' });
        onSuccess();
        loadSchema();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      showToast({ message: `Error: ${err.message}`, variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleRenameColumn = async () => {
    const errors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    if (!selectedColumn) {
      errors.selectedColumn = 'Please select a column';
      newTouched.selectedColumn = true;
    }

    if (!renamedColumnName.trim()) {
      errors.renamedColumnName = 'New column name is required';
      newTouched.renamedColumnName = true;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setTouched({ ...touched, ...newTouched });
      return;
    }

    setLoading(true);
    setFormErrors({});
    try {
      const result = await apiClient.renameColumn(
        tableName,
        selectedColumn,
        renamedColumnName.trim()
      );

      if (result.success) {
        showToast({ message: 'Column renamed successfully!', variant: 'success' });
        onSuccess();
        loadSchema();
        resetForms();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      showToast({ message: `Error: ${err.message}`, variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleRenameTable = async () => {
    const errors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    if (!newTableName.trim()) {
      errors.newTableName = 'New table name is required';
      newTouched.newTableName = true;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setTouched({ ...touched, ...newTouched });
      return;
    }

    setLoading(true);
    setFormErrors({});
    try {
      const result = await apiClient.renameTable(tableName, newTableName.trim());

      if (result.success) {
        showToast({ message: 'Table renamed successfully!', variant: 'success' });
        onSuccess();
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      showToast({ message: `Error: ${err.message}`, variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const renderMainView = () => (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}

      <div style="margin-bottom: 20px;">
        <h4 style="margin-bottom: 10px;">Table Actions</h4>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <Button onClick={() => setMode('add')} variant="primary">
            Add Column
          </Button>
          <Button onClick={() => setMode('rename')} variant="secondary">
            Rename Column
          </Button>
          <Button onClick={() => setMode('renameTable')} variant="secondary">
            Rename Table
          </Button>
        </div>
      </div>

      <div>
        <h4 style="margin-bottom: 10px;">Current Columns ({columns.length})</h4>
        {loading ? (
          <div className="loading">Loading schema...</div>
        ) : columns.length === 0 ? (
          <Alert variant="info">No columns found</Alert>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Constraints</th>
                <th style="width: 100px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => (
                <tr key={col.cid}>
                  <td>
                    <strong>{col.name}</strong>
                    {col.pk === 1 && <span className="badge badge-primary" style="margin-left: 8px;">PK</span>}
                  </td>
                  <td>{col.type}</td>
                  <td>
                    {col.notnull === 1 && <span className="badge badge-secondary">NOT NULL</span>}
                    {col.dflt_value !== null && (
                      <span className="badge badge-secondary" style="margin-left: 4px;">
                        DEFAULT: {col.dflt_value}
                      </span>
                    )}
                  </td>
                  <td>
                    {col.pk !== 1 && (
                      <Button
                        onClick={() => handleDropColumn(col.name)}
                        variant="danger"
                        className="btn-sm"
                      >
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style="margin-top: 20px;">
        <Alert variant="info">
          <strong>Note:</strong> D1/SQLite has limited ALTER TABLE support. You cannot modify column types directly.
          To change a column type, you'll need to create a new table with the desired schema and migrate data.
        </Alert>
      </div>
    </div>
  );

  const renderAddColumnView = () => (
    <div>
      <h4 style="margin-bottom: 20px;">Add New Column</h4>

      <FormField
        label="Column Name"
        name="newColumnName"
        error={formErrors.newColumnName}
        touched={touched.newColumnName}
        required
      >
        <input
          type="text"
          id="newColumnName"
          className={`form-control ${formErrors.newColumnName && touched.newColumnName ? 'error' : ''}`}
          value={newColumnName}
          onInput={(e) => setNewColumnName((e.target as HTMLInputElement).value)}
          placeholder="e.g. email"
        />
      </FormField>

      <FormField
        label="Column Type"
        name="newColumnType"
        error={formErrors.newColumnType}
        touched={touched.newColumnType}
        required
      >
        <select
          id="newColumnType"
          className={`form-control ${formErrors.newColumnType && touched.newColumnType ? 'error' : ''}`}
          value={newColumnType}
          onChange={(e) => setNewColumnType((e.target as HTMLSelectElement).value)}
        >
          <optgroup label="Basic Types">
            <option value="INTEGER">INTEGER - Whole numbers</option>
            <option value="TEXT">TEXT - String/text data</option>
            <option value="REAL">REAL - Decimal numbers</option>
            <option value="BLOB">BLOB - Binary data</option>
            <option value="NUMERIC">NUMERIC - Flexible numeric</option>
          </optgroup>
          <optgroup label="Extended Types">
            <option value="UUID">UUID - Unique identifier</option>
            <option value="DATETIME">DATETIME - Date and time</option>
            <option value="TIMESTAMP">TIMESTAMP - Unix timestamp</option>
            <option value="DATE">DATE - Date only</option>
            <option value="TIME">TIME - Time only</option>
            <option value="BOOLEAN">BOOLEAN - True/false</option>
            <option value="JSON">JSON - JSON data</option>
          </optgroup>
        </select>
      </FormField>

      <FormField
        label="Constraints (Optional)"
        name="newColumnConstraints"
        hint="Add column constraints like NOT NULL, UNIQUE, DEFAULT, CHECK, etc."
      >
        <input
          type="text"
          id="newColumnConstraints"
          className="form-control"
          value={newColumnConstraints}
          onInput={(e) => setNewColumnConstraints((e.target as HTMLInputElement).value)}
          placeholder="e.g. NOT NULL DEFAULT 'default_value'"
        />
      </FormField>

      <div style="margin-bottom: 20px;">
        <div style="font-size: 12px; color: #666; background: #f8f9fa; padding: 12px; border-radius: 4px; border-left: 3px solid #0066cc;">
          <strong>常用约束：</strong>
          <ul style="margin: 8px 0 0 0; padding-left: 20px;">
            <li><code>NOT NULL</code> - 不允许空值</li>
            <li><code>UNIQUE</code> - 值必须唯一</li>
            <li><code>DEFAULT value</code> - 设置默认值（文本需要加引号，如 <code>DEFAULT 'active'</code>）</li>
            <li><code>CHECK (condition)</code> - 检查约束（如 <code>CHECK (age &gt;= 0)</code>）</li>
          </ul>
          <div style="margin-top: 8px; font-style: italic;">
            示例：<code>NOT NULL DEFAULT 0</code> 或 <code>UNIQUE CHECK (price &gt; 0)</code>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
        <Button onClick={() => setMode('main')} variant="secondary" disabled={loading}>
          Back
        </Button>
        <Button onClick={handleAddColumn} variant="primary" disabled={loading}>
          {loading ? 'Adding...' : 'Add Column'}
        </Button>
      </div>
    </div>
  );

  const renderRenameColumnView = () => (
    <div>
      <h4 style="margin-bottom: 20px;">Rename Column</h4>

      <FormField
        label="Select Column"
        name="selectedColumn"
        error={formErrors.selectedColumn}
        touched={touched.selectedColumn}
        required
      >
        <select
          id="selectedColumn"
          className={`form-control ${formErrors.selectedColumn && touched.selectedColumn ? 'error' : ''}`}
          value={selectedColumn}
          onChange={(e) => setSelectedColumn((e.target as HTMLSelectElement).value)}
        >
          <option value="">-- Select a column --</option>
          {columns.map((col) => (
            <option key={col.cid} value={col.name}>
              {col.name} ({col.type})
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="New Column Name"
        name="renamedColumnName"
        error={formErrors.renamedColumnName}
        touched={touched.renamedColumnName}
        required
      >
        <input
          type="text"
          id="renamedColumnName"
          className={`form-control ${formErrors.renamedColumnName && touched.renamedColumnName ? 'error' : ''}`}
          value={renamedColumnName}
          onInput={(e) => setRenamedColumnName((e.target as HTMLInputElement).value)}
          placeholder="Enter new column name"
        />
      </FormField>

      <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
        <Button onClick={() => setMode('main')} variant="secondary" disabled={loading}>
          Back
        </Button>
        <Button onClick={handleRenameColumn} variant="primary" disabled={loading}>
          {loading ? 'Renaming...' : 'Rename Column'}
        </Button>
      </div>
    </div>
  );

  const renderRenameTableView = () => (
    <div>
      <h4 style="margin-bottom: 20px;">Rename Table</h4>

      <FormField
        label="Current Table Name"
        name="currentTableName"
      >
        <input
          type="text"
          id="currentTableName"
          className="form-control"
          value={tableName}
          disabled
        />
      </FormField>

      <FormField
        label="New Table Name"
        name="newTableName"
        error={formErrors.newTableName}
        touched={touched.newTableName}
        required
      >
        <input
          type="text"
          id="newTableName"
          className={`form-control ${formErrors.newTableName && touched.newTableName ? 'error' : ''}`}
          value={newTableName}
          onInput={(e) => setNewTableName((e.target as HTMLInputElement).value)}
          placeholder="Enter new table name"
        />
      </FormField>

      <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
        <Button onClick={() => setMode('main')} variant="secondary" disabled={loading}>
          Back
        </Button>
        <Button onClick={handleRenameTable} variant="primary" disabled={loading}>
          {loading ? 'Renaming...' : 'Rename Table'}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Table: ${tableName}`}
      size="large"
    >
      {mode === 'main' && renderMainView()}
      {mode === 'add' && renderAddColumnView()}
      {mode === 'rename' && renderRenameColumnView()}
      {mode === 'renameTable' && renderRenameTableView()}

      {mode === 'main' && (
        <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      )}
    </Modal>
  );
}

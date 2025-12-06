import { useState } from 'preact/hooks';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { FormField } from '../shared/FormField';
import { useNotification } from '../../contexts/NotificationContext';
import { useFormValidation } from '../../hooks/useFormValidation';

interface Field {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  autoIncrement: boolean;
  notNull: boolean;
  unique: boolean;
  defaultValue: string;
}

interface VisualTableBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  apiClient: any;
}

const FIELD_TYPES = [
  { value: 'INTEGER', label: 'INTEGER', description: 'Whole numbers' },
  { value: 'TEXT', label: 'TEXT', description: 'String/text data' },
  { value: 'REAL', label: 'REAL', description: 'Decimal numbers' },
  { value: 'BLOB', label: 'BLOB', description: 'Binary data' },
  { value: 'NUMERIC', label: 'NUMERIC', description: 'Numeric data (flexible storage)' },
  { value: 'UUID', label: 'UUID', description: 'Unique identifier (stored as TEXT)' },
  { value: 'DATETIME', label: 'DATETIME', description: 'Date and time (stored as TEXT)' },
  { value: 'TIMESTAMP', label: 'TIMESTAMP', description: 'Unix timestamp (stored as TEXT)' },
  { value: 'DATE', label: 'DATE', description: 'Date only (stored as TEXT)' },
  { value: 'TIME', label: 'TIME', description: 'Time only (stored as TEXT)' },
  { value: 'BOOLEAN', label: 'BOOLEAN', description: 'True/false (stored as INTEGER)' },
  { value: 'JSON', label: 'JSON', description: 'JSON data (stored as TEXT)' },
];

export function VisualTableBuilder({ isOpen, onClose, onSuccess, apiClient }: VisualTableBuilderProps) {
  const { showToast } = useNotification();
  const [tableName, setTableName] = useState('');
  const [fields, setFields] = useState<Field[]>([
    {
      id: '1',
      name: 'id',
      type: 'INTEGER',
      isPrimaryKey: true,
      autoIncrement: true,
      notNull: true,
      unique: false,
      defaultValue: '',
    },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { errors, touched, validate, handleBlur, clearAllErrors } = useFormValidation({
    tableName: {
      required: true,
      minLength: 1,
      maxLength: 64,
      custom: (value) => {
        if (value && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
          return 'Table name must start with a letter or underscore and contain only letters, numbers, and underscores';
        }
        return null;
      }
    }
  });

  const addField = () => {
    const newField: Field = {
      id: Date.now().toString(),
      name: '',
      type: 'TEXT',
      isPrimaryKey: false,
      autoIncrement: false,
      notNull: false,
      unique: false,
      defaultValue: '',
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    if (fields.length === 1) {
      setError('Table must have at least one field');
      return;
    }
    setFields(fields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    setFields(
      fields.map((f) =>
        f.id === id
          ? {
              ...f,
              ...updates,
              // Auto-uncheck incompatible options
              autoIncrement:
                updates.type && updates.type !== 'INTEGER' ? false : updates.autoIncrement ?? f.autoIncrement,
            }
          : f
      )
    );
  };

  const togglePrimaryKey = (id: string) => {
    setFields(
      fields.map((f) =>
        f.id === id
          ? { ...f, isPrimaryKey: !f.isPrimaryKey, notNull: !f.isPrimaryKey || f.notNull }
          : f
      )
    );
  };

  const quoteIdentifier = (identifier: string): string => {
    // SQLite uses double quotes for identifiers (table names, column names)
    // Escape any existing double quotes by doubling them
    return `"${identifier.replace(/"/g, '""')}"`;
  };

  const generateSQL = (): string => {
    if (!tableName.trim()) return '-- Enter table name';
    if (fields.length === 0) return '-- Add at least one field';
    if (fields.some((f) => !f.name.trim())) return '-- All fields must have names';

    const primaryKeys = fields.filter((f) => f.isPrimaryKey);
    const fieldDefinitions = fields.map((f) => {
      // Quote field name to handle SQL reserved keywords
      let def = `  ${quoteIdentifier(f.name)} `;

      // Map special types to SQLite types
      const typeMap: Record<string, string> = {
        UUID: 'TEXT',
        DATETIME: 'TEXT',
        TIMESTAMP: 'TEXT',
        DATE: 'TEXT',
        TIME: 'TEXT',
        BOOLEAN: 'INTEGER',
        JSON: 'TEXT',
      };
      def += typeMap[f.type] || f.type;

      // Primary key (for single PK with auto-increment)
      if (f.isPrimaryKey && primaryKeys.length === 1 && f.autoIncrement && f.type === 'INTEGER') {
        def += ' PRIMARY KEY AUTOINCREMENT';
      }

      // Constraints
      if (f.notNull && !f.isPrimaryKey) {
        def += ' NOT NULL';
      }

      if (f.unique && !f.isPrimaryKey) {
        def += ' UNIQUE';
      }

      if (f.defaultValue.trim()) {
        // Smart quote handling for default values
        const needsQuotes = ['TEXT', 'UUID', 'DATETIME', 'TIMESTAMP', 'DATE', 'TIME', 'JSON'].includes(f.type);
        const value = needsQuotes ? `'${f.defaultValue}'` : f.defaultValue;
        def += ` DEFAULT ${value}`;
      }

      return def;
    });

    // Quote table name to handle SQL reserved keywords
    let sql = `CREATE TABLE ${quoteIdentifier(tableName)} (\n${fieldDefinitions.join(',\n')}`;

    // Composite primary key or non-auto-increment single PK
    if (primaryKeys.length > 1 || (primaryKeys.length === 1 && (!primaryKeys[0].autoIncrement || primaryKeys[0].type !== 'INTEGER'))) {
      const pkFields = primaryKeys.map((f) => quoteIdentifier(f.name)).join(', ');
      sql += `,\n  PRIMARY KEY (${pkFields})`;
    }

    sql += '\n);';
    return sql;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    // Validate table name
    if (!validate({ tableName })) {
      return;
    }

    // Validate field names
    if (fields.some((f) => !f.name.trim())) {
      setError('All fields must have names');
      return;
    }

    const sql = generateSQL();
    setLoading(true);

    try {
      const result = await apiClient.createTable(sql);
      if (result.success) {
        showToast({ message: 'Table created successfully!', variant: 'success' });
        clearAllErrors();
        onSuccess();
        handleClose();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create table');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTableName('');
    setFields([
      {
        id: '1',
        name: 'id',
        type: 'INTEGER',
        isPrimaryKey: true,
        autoIncrement: true,
        notNull: true,
        unique: false,
        defaultValue: '',
      },
    ]);
    setError('');
    clearAllErrors();
    onClose();
  };

  const sql = generateSQL();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🎨 Visual Table Builder" size="large">
      <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <FormField
            label="Table Name"
            name="tableName"
            error={errors.tableName}
            touched={touched.tableName}
            required
            hint="Must start with a letter or underscore, contain only letters, numbers, and underscores"
          >
            <input
              type="text"
              id="tableName"
              className={`form-control ${errors.tableName && touched.tableName ? 'error' : ''}`}
              placeholder="e.g., users, products, orders"
              value={tableName}
              onInput={(e) => setTableName((e.target as HTMLInputElement).value)}
              onBlur={() => handleBlur('tableName', tableName)}
            />
          </FormField>

          <div className="field-builder">
            <div className="field-builder-header">
              <h4>Fields</h4>
              <Button type="button" onClick={addField} variant="success" className="btn-sm">
                ➕ Add Field
              </Button>
            </div>

            <div className="field-list">
              {fields.map((field, index) => (
                <div key={field.id} className="field-card">
                  <div className="field-card-header">
                    <span className="field-number">#{index + 1}</span>
                    <input
                      type="text"
                      className="form-control field-name-input"
                      placeholder="Field name (required)"
                      value={field.name}
                      onInput={(e) => updateField(field.id, { name: (e.target as HTMLInputElement).value })}
                    />
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeField(field.id)}
                      disabled={fields.length === 1}
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="field-card-body">
                    <div className="field-row">
                      <div className="form-group">
                        <label>Type</label>
                        <select
                          className="form-control"
                          value={field.type}
                          onChange={(e) => updateField(field.id, { type: (e.target as HTMLSelectElement).value })}
                        >
                          {FIELD_TYPES.map((type) => (
                            <option key={type.value} value={type.value} title={type.description}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Default Value</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Optional"
                          value={field.defaultValue}
                          onInput={(e) =>
                            updateField(field.id, { defaultValue: (e.target as HTMLInputElement).value })
                          }
                        />
                      </div>
                    </div>

                    <div className="field-constraints">
                      <div className="checkbox-group">
                        <input
                          type="checkbox"
                          id={`pk-${field.id}`}
                          checked={field.isPrimaryKey}
                          onChange={() => togglePrimaryKey(field.id)}
                        />
                        <label htmlFor={`pk-${field.id}`}>🔑 Primary Key</label>
                      </div>

                      {field.type === 'INTEGER' && field.isPrimaryKey && (
                        <div className="checkbox-group">
                          <input
                            type="checkbox"
                            id={`ai-${field.id}`}
                            checked={field.autoIncrement}
                            onChange={(e) =>
                              updateField(field.id, { autoIncrement: (e.target as HTMLInputElement).checked })
                            }
                          />
                          <label htmlFor={`ai-${field.id}`}>↗️ Auto Increment</label>
                        </div>
                      )}

                      <div className="checkbox-group">
                        <input
                          type="checkbox"
                          id={`nn-${field.id}`}
                          checked={field.notNull}
                          onChange={(e) =>
                            updateField(field.id, { notNull: (e.target as HTMLInputElement).checked })
                          }
                        />
                        <label htmlFor={`nn-${field.id}`}>⚠️ NOT NULL</label>
                      </div>

                      <div className="checkbox-group">
                        <input
                          type="checkbox"
                          id={`uq-${field.id}`}
                          checked={field.unique}
                          onChange={(e) =>
                            updateField(field.id, { unique: (e.target as HTMLInputElement).checked })
                          }
                        />
                        <label htmlFor={`uq-${field.id}`}>🔒 UNIQUE</label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sql-preview">
            <h4>SQL Preview</h4>
            <pre>
              <code>{sql}</code>
            </pre>
          </div>

        <div className="modal-footer">
          <Button type="button" onClick={handleClose} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? '⏳ Creating...' : '✨ Create Table'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

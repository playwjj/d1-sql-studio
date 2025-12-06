import { useState } from 'preact/hooks';
import { Modal, Button, Alert, FormField } from '../shared';
import { ApiClient } from '../../lib/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useFormValidation } from '../../hooks/useFormValidation';

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiClient: ApiClient;
  onSuccess: () => void;
}

export function CreateTableModal({ isOpen, onClose, apiClient, onSuccess }: CreateTableModalProps) {
  const { showToast } = useNotification();
  const [sql, setSql] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { errors, touched, validate, handleBlur, clearAllErrors } = useFormValidation({
    sql: {
      required: true,
      minLength: 10,
      custom: (value) => {
        if (value && !value.trim().toLowerCase().startsWith('create table')) {
          return 'SQL statement must start with CREATE TABLE';
        }
        return null;
      }
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!validate({ sql })) {
      return;
    }

    setLoading(true);

    try {
      const result = await apiClient.createTable(sql);
      if (result.success) {
        showToast({ message: 'Table created successfully!', variant: 'success' });
        setSql('');
        clearAllErrors();
        onSuccess();
        onClose();
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
    setSql('');
    setError('');
    clearAllErrors();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Table" size="large">
      <form onSubmit={handleSubmit}>
        {error && <Alert variant="danger">{error}</Alert>}

        <FormField
          label="SQL Statement"
          name="sql"
          error={errors.sql}
          touched={touched.sql}
          required
          hint='Enter a CREATE TABLE statement. Use double quotes for SQL keywords: "update", "delete", "order", etc.'
        >
          <textarea
            className={`form-control ${errors.sql && touched.sql ? 'error' : ''}`}
            placeholder="CREATE TABLE users (&#10;  id INTEGER PRIMARY KEY AUTOINCREMENT,&#10;  name TEXT NOT NULL,&#10;  email TEXT UNIQUE,&#10;  &quot;update&quot; TEXT,&#10;  &quot;order&quot; INTEGER&#10;);"
            value={sql}
            onInput={(e) => setSql((e.target as HTMLTextAreaElement).value)}
            onBlur={() => handleBlur('sql', sql)}
            rows={12}
          />
        </FormField>

        <Alert variant="info">
          <strong>💡 提示：</strong>如果字段名或表名是 SQL 关键字（如 update, delete, order, select 等），请使用双引号包裹，例如：<code>"update"</code>, <code>"delete"</code>
        </Alert>

        <div className="modal-footer">
          <Button type="button" onClick={handleClose} variant="secondary" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={loading}>
            {loading ? 'Creating...' : '✓ Create Table'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

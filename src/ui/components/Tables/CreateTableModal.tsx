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
          hint="Enter a CREATE TABLE statement. Example: CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);"
        >
          <textarea
            className={`form-control ${errors.sql && touched.sql ? 'error' : ''}`}
            placeholder="CREATE TABLE users (&#10;  id INTEGER PRIMARY KEY AUTOINCREMENT,&#10;  name TEXT NOT NULL,&#10;  email TEXT UNIQUE&#10;);"
            value={sql}
            onInput={(e) => setSql((e.target as HTMLTextAreaElement).value)}
            onBlur={() => handleBlur('sql', sql)}
            rows={12}
          />
        </FormField>

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

import { useState } from 'preact/hooks';
import { Modal, Button, Alert } from '../shared';
import { ApiClient } from '../../lib/api';

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiClient: ApiClient;
  onSuccess: () => void;
}

export function CreateTableModal({ isOpen, onClose, apiClient, onSuccess }: CreateTableModalProps) {
  const [sql, setSql] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await apiClient.createTable(sql);
      if (result.success) {
        alert('Table created successfully!');
        setSql('');
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
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Table" size="large">
      <form onSubmit={handleSubmit}>
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="form-group">
          <label>SQL Statement</label>
          <textarea
            className="form-control"
            placeholder="CREATE TABLE users (&#10;  id INTEGER PRIMARY KEY AUTOINCREMENT,&#10;  name TEXT NOT NULL,&#10;  email TEXT UNIQUE&#10;);"
            value={sql}
            onInput={(e) => setSql((e.target as HTMLTextAreaElement).value)}
            rows={12}
            required
          />
          <small style="color: var(--text-light); display: block; margin-top: 8px;">
            Enter a CREATE TABLE statement. Example: CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
          </small>
        </div>

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

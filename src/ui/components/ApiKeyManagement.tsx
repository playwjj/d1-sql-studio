import { useState, useEffect } from 'preact/hooks';
import { ApiClient } from '../lib/api';
import { Button, Alert } from './shared';

interface ApiKeyManagementProps {
  apiClient: ApiClient;
}

interface ApiKeyInfo {
  name: string;
  description?: string;
  createdAt: string;
  lastUsedAt?: string;
}

interface ApiKeyData extends ApiKeyInfo {
  key: string;
}

export function ApiKeyManagement({ apiClient }: ApiKeyManagementProps) {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.request<ApiKeyInfo[]>('/api/keys');
      if (result.success && result.data) {
        setKeys(result.data);
      } else {
        setError(result.error || 'Failed to load API keys');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: Event) => {
    e.preventDefault();
    setCreatingKey(true);
    setError('');

    try {
      const result = await apiClient.request<ApiKeyData>('/api/keys', {
        method: 'POST',
        body: JSON.stringify({
          name: newKeyName,
          description: newKeyDescription || undefined
        }),
      });

      if (result.success && result.data) {
        setGeneratedKey(result.data.key);
        setNewKeyName('');
        setNewKeyDescription('');
        await loadKeys();
      } else {
        setError(result.error || 'Failed to create API key');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create API key');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleDeleteKey = async (name: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await apiClient.request(`/api/keys/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });

      if (result.success) {
        await loadKeys();
      } else {
        alert(result.error || 'Failed to delete API key');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete API key');
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    alert('API key copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading API keys...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card-header">
        <h3>API Key Management</h3>
        <Button
          variant="success"
          className="btn-sm"
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setGeneratedKey(null);
            setError('');
          }}
        >
          {showCreateForm ? '✕ Cancel' : '➕ Create New Key'}
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {showCreateForm && !generatedKey && (
        <div
          style={{
            marginBottom: '20px',
            padding: '16px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
          }}
        >
          <h4 style="margin-bottom: 12px;">Create New API Key</h4>
          <form onSubmit={handleCreateKey}>
            <div className="form-group" style="margin-bottom: 12px;">
              <label>Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onInput={(e) => setNewKeyName((e.target as HTMLInputElement).value)}
                placeholder="e.g., Production Key"
                required
                disabled={creatingKey}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  fontSize: '14px'
                }}
              />
            </div>
            <div className="form-group" style="margin-bottom: 12px;">
              <label>Description (Optional)</label>
              <textarea
                value={newKeyDescription}
                onInput={(e) => setNewKeyDescription((e.target as HTMLTextAreaElement).value)}
                placeholder="e.g., Used for production environment, full permissions, created in Jan 2025"
                disabled={creatingKey}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '6px',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <Button variant="primary" type="submit" disabled={creatingKey}>
              {creatingKey ? 'Creating...' : 'Create Key'}
            </Button>
          </form>
        </div>
      )}

      {generatedKey && (
        <Alert variant="success">
          <strong>✓ API Key Created Successfully!</strong>
          <p style="margin-top: 8px;">
            Please save this key securely. You won't be able to see it again.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '12px',
              background: '#000',
              padding: '12px',
              borderRadius: '6px',
            }}
          >
            <code
              style={{
                flex: 1,
                color: '#4ade80',
                fontSize: '14px',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}
            >
              {generatedKey}
            </code>
            <button
              onClick={() => handleCopy(generatedKey)}
              className="btn btn-secondary btn-sm"
              style={{ whiteSpace: 'nowrap' }}
            >
              📋 Copy
            </button>
          </div>
        </Alert>
      )}

      {keys.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔑</div>
          <div className="empty-state-text">No API Keys</div>
          <div className="empty-state-subtext">Create your first API key to get started</div>
        </div>
      ) : (
        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Created</th>
                <th>Last Used</th>
                <th style="width: 100px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key, idx) => (
                <tr key={idx}>
                  <td>
                    <strong>{key.name}</strong>
                  </td>
                  <td>
                    {key.description ? (
                      <span style="color: var(--text-secondary); font-size: 13px;">{key.description}</span>
                    ) : (
                      <span style="color: var(--text-light); font-style: italic;">—</span>
                    )}
                  </td>
                  <td>{formatDate(key.createdAt)}</td>
                  <td>
                    {key.lastUsedAt ? (
                      formatDate(key.lastUsedAt)
                    ) : (
                      <span style="color: var(--text-light); font-style: italic;">Never</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteKey(key.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div
        style={{
          marginTop: '20px',
          padding: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          fontSize: '13px',
        }}
      >
        <strong>⚠️ Important:</strong> Deleting an API key will immediately revoke access for any applications using it.
      </div>
    </div>
  );
}

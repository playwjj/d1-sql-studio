import { useState, useEffect } from 'preact/hooks';
import { ApiClient } from '../lib/api';
import { Button, Alert, FormField } from './shared';
import { useNotification } from '../contexts/NotificationContext';
import { useFormValidation } from '../hooks/useFormValidation';

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
  const { showToast, showConfirm } = useNotification();
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const { errors, touched, validate, handleBlur, clearAllErrors } = useFormValidation({
    keyName: {
      required: true,
      minLength: 3,
      maxLength: 50,
      custom: (value) => {
        if (value && !/^[a-zA-Z0-9\s_-]+$/.test(value)) {
          return 'Key name can only contain letters, numbers, spaces, hyphens, and underscores';
        }
        return null;
      }
    },
    keyDescription: {
      maxLength: 200,
    }
  });

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

    // Validate form
    if (!validate({ keyName: newKeyName, keyDescription: newKeyDescription })) {
      setCreatingKey(false);
      return;
    }

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
        clearAllErrors();
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
    const confirmed = await showConfirm({
      title: 'Delete API Key',
      message: 'Are you sure you want to delete this API key? This action cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await apiClient.request(`/api/keys/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });

      if (result.success) {
        await loadKeys();
        showToast({ message: 'API key deleted successfully', variant: 'success' });
      } else {
        showToast({ message: result.error || 'Failed to delete API key', variant: 'danger' });
      }
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to delete API key', variant: 'danger' });
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    showToast({ message: 'API key copied to clipboard!', variant: 'success' });
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
            <FormField
              label="Key Name"
              name="keyName"
              error={errors.keyName}
              touched={touched.keyName}
              required
              hint="3-50 characters, letters, numbers, spaces, hyphens, and underscores"
            >
              <input
                type="text"
                className={`form-control ${errors.keyName && touched.keyName ? 'error' : ''}`}
                value={newKeyName}
                onInput={(e) => setNewKeyName((e.target as HTMLInputElement).value)}
                onBlur={() => handleBlur('keyName', newKeyName)}
                placeholder="e.g., Production Key"
                disabled={creatingKey}
              />
            </FormField>
            <FormField
              label="Description (Optional)"
              name="keyDescription"
              error={errors.keyDescription}
              touched={touched.keyDescription}
              hint="Optional description for this API key (max 200 characters)"
            >
              <textarea
                className={`form-control ${errors.keyDescription && touched.keyDescription ? 'error' : ''}`}
                value={newKeyDescription}
                onInput={(e) => setNewKeyDescription((e.target as HTMLTextAreaElement).value)}
                onBlur={() => handleBlur('keyDescription', newKeyDescription)}
                placeholder="e.g., Used for production environment, full permissions, created in Jan 2025"
                disabled={creatingKey}
                rows={3}
              />
            </FormField>
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

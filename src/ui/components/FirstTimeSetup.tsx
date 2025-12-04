import { useState } from 'preact/hooks';
import { Button, Alert } from './shared';
import { useNotification } from '../contexts/NotificationContext';

interface FirstTimeSetupProps {
  onSetupComplete: (apiKey: string) => void;
}

export function FirstTimeSetup({ onSetupComplete }: FirstTimeSetupProps) {
  const { showToast } = useNotification();
  const [name, setName] = useState('Default Key');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleGenerate = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description: description || undefined
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setGeneratedKey(result.data.key);
      } else {
        setError(result.error || 'Failed to generate API key');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate API key');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (generatedKey) {
      onSetupComplete(generatedKey);
    }
  };

  const handleCopy = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      showToast({ message: 'API key copied to clipboard!', variant: 'success' });
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🔑 First Time Setup</h1>
        <p>Welcome to D1 SQL Studio! Let's create your first API key.</p>

        {error && <Alert variant="danger">{error}</Alert>}

        {!generatedKey ? (
          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label>API Key Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onInput={(e) => setName((e.target as HTMLInputElement).value)}
                placeholder="Enter a name for this key"
                required
                disabled={loading}
              />
              <small style="color: var(--text-light); margin-top: 4px; display: block;">
                Give your API key a descriptive name (e.g., "Production Key", "Development Key")
              </small>
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                className="form-control"
                value={description}
                onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
                placeholder="e.g., Primary API key for production environment"
                disabled={loading}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            <Button variant="primary" type="submit" disabled={loading} className="btn-block">
              {loading ? 'Generating...' : 'Generate API Key'}
            </Button>
          </form>
        ) : (
          <div>
            <Alert variant="success">
              <strong>✓ API Key Generated Successfully!</strong>
              <p style="margin-top: 8px;">
                Please save this key securely. You won't be able to see it again.
              </p>
            </Alert>

            <div style="margin-top: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text);">
                Your API Key:
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  background: '#000',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
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
                  onClick={handleCopy}
                  className="btn btn-secondary btn-sm"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  📋 Copy
                </button>
              </div>
            </div>

            <div style="margin-top: 20px;">
              <Button variant="primary" onClick={handleContinue} className="btn-block">
                Continue to Dashboard
              </Button>
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            background: 'rgba(56, 139, 253, 0.1)',
            border: '1px solid rgba(56, 139, 253, 0.3)',
            borderRadius: '6px',
            fontSize: '13px',
            color: 'var(--text)',
          }}
        >
          <strong>ℹ️ About API Keys</strong>
          <p style="margin: 8px 0 0 0; line-height: 1.5; color: var(--text-light);">
            API keys are used to authenticate requests to your database. Keep them secure and never share them publicly.
          </p>
        </div>
      </div>
    </div>
  );
}

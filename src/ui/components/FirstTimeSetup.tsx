import { useState } from 'preact/hooks';
import { Button, Alert, FormField } from './shared';
import { useNotification } from '../contexts/NotificationContext';
import { useFormValidation } from '../hooks/useFormValidation';

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

  const handleGenerate = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate form
    if (!validate({ keyName: name, keyDescription: description })) {
      setLoading(false);
      return;
    }

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
        clearAllErrors();
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
            <FormField
              label="API Key Name"
              name="keyName"
              error={errors.keyName}
              touched={touched.keyName}
              required
              hint="3-50 characters, letters, numbers, spaces, hyphens, and underscores"
            >
              <input
                type="text"
                className={`form-control ${errors.keyName && touched.keyName ? 'error' : ''}`}
                value={name}
                onInput={(e) => setName((e.target as HTMLInputElement).value)}
                onBlur={() => handleBlur('keyName', name)}
                placeholder="e.g., Production Key, Development Key"
                disabled={loading}
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
                value={description}
                onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
                onBlur={() => handleBlur('keyDescription', description)}
                placeholder="e.g., Primary API key for production environment"
                disabled={loading}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </FormField>

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

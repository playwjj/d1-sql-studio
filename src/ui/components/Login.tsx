import { useState, useEffect } from 'preact/hooks';
import { ApiClient } from '../lib/api';
import { FormField } from './shared';
import { useFormValidation } from '../hooks/useFormValidation';

interface LoginProps {
  onLogin: (apiKey: string) => void;
  savedApiKey: string;
}

export function Login({ onLogin, savedApiKey }: LoginProps) {
  const [apiKey, setApiKey] = useState(savedApiKey);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  const { errors, touched, validate, handleBlur } = useFormValidation({
    apiKey: {
      required: true,
      minLength: 10,
    }
  });

  useEffect(() => {
    if (savedApiKey && !autoLoginAttempted) {
      setAutoLoginAttempted(true);
      handleSubmit(new Event('submit') as any);
    }
  }, [savedApiKey]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    // Skip validation for auto-login
    if (!autoLoginAttempted && !validate({ apiKey })) {
      return;
    }

    setLoading(true);

    try {
      const client = new ApiClient(apiKey);
      const result = await client.listTables();

      if (result.success) {
        onLogin(apiKey);
      } else if (result.error === 'DATABASE_NOT_BOUND') {
        onLogin(apiKey); // Allow login but will show setup guide
      } else {
        throw new Error(result.error || 'Invalid API Key');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🗄️ D1 SQL Studio</h1>
        <p>Database Management Interface</p>

        {error && (
          <div className="alert alert-danger">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormField
            label="API Key"
            name="apiKey"
            error={errors.apiKey}
            touched={touched.apiKey}
            required
            hint="Your API key should be at least 10 characters"
          >
            <input
              type="password"
              id="apiKey"
              className={`form-control ${errors.apiKey && touched.apiKey ? 'error' : ''}`}
              placeholder="Enter your API key"
              value={apiKey}
              onInput={(e) => setApiKey((e.target as HTMLInputElement).value)}
              onBlur={() => handleBlur('apiKey', apiKey)}
              disabled={loading}
            />
          </FormField>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            🔐 {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

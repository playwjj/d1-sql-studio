import { useState, useEffect } from 'preact/hooks';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { FirstTimeSetup } from './components/FirstTimeSetup';
import { NotificationProvider } from './contexts/NotificationContext';

export function App() {
  // Synchronously initialize from localStorage to avoid timing issues
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('d1_api_key') || '';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasKeys, setHasKeys] = useState<boolean | null>(null);
  const [checkingKeys, setCheckingKeys] = useState(true);

  useEffect(() => {
    checkKeysStatus();
  }, []);

  const checkKeysStatus = async () => {
    try {
      const response = await fetch('/api/keys/status');
      const result = await response.json();
      if (result.success && result.data) {
        setHasKeys(result.data.hasKeys);
      }
    } catch (err) {
      console.error('Failed to check keys status:', err);
      // Assume keys exist if check fails (fallback to login)
      setHasKeys(true);
    } finally {
      setCheckingKeys(false);
    }
  };

  const handleLogin = (key: string) => {
    setApiKey(key);
    setIsAuthenticated(true);
    localStorage.setItem('d1_api_key', key);
  };

  const handleLogout = () => {
    setApiKey('');
    setIsAuthenticated(false);
    localStorage.removeItem('d1_api_key');
  };

  const handleSetupComplete = (key: string) => {
    setHasKeys(true);
    handleLogin(key);
  };

  return (
    <NotificationProvider>
      {checkingKeys ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : hasKeys === false ? (
        <FirstTimeSetup onSetupComplete={handleSetupComplete} />
      ) : !isAuthenticated ? (
        <Login onLogin={handleLogin} savedApiKey={apiKey} />
      ) : (
        <Dashboard apiKey={apiKey} onLogout={handleLogout} />
      )}
    </NotificationProvider>
  );
}

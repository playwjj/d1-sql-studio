import { useState, useEffect } from 'preact/hooks';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';

export function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('d1_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      // Will be validated by child components
    }
  }, []);

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

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} savedApiKey={apiKey} />;
  }

  return <Dashboard apiKey={apiKey} onLogout={handleLogout} />;
}

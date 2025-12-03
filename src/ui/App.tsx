import { useState } from 'preact/hooks';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';

export function App() {
  // Synchronously initialize from localStorage to avoid timing issues
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('d1_api_key') || '';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

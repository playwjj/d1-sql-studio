import { useState } from 'preact/hooks';
import { ApiClient } from '../lib/api';
import { TablesView } from './Tables';
import { DataBrowser } from './DataBrowser';
import { QueryEditor } from './QueryEditor';

interface DashboardProps {
  apiKey: string;
  onLogout: () => void;
}

export function Dashboard({ apiKey, onLogout }: DashboardProps) {
  const [currentView, setCurrentView] = useState<'tables' | 'data' | 'query'>('tables');
  const [selectedTable, setSelectedTable] = useState<string>('');

  const apiClient = new ApiClient(apiKey);

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setCurrentView('data');
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 style="font-size: 1.5em; margin-bottom: 4px;">🗄️ D1 SQL Studio</h1>
          <p style="font-size: 0.9em; margin: 0; opacity: 0.9;">Database Manager</p>
        </div>

        <div className="sidebar-nav">
          <div
            className={`nav-item ${currentView === 'tables' ? 'active' : ''}`}
            onClick={() => setCurrentView('tables')}
          >
            <span className="nav-item-icon">📊</span>
            <span>Tables</span>
          </div>
          <div
            className={`nav-item ${currentView === 'data' ? 'active' : ''}`}
            onClick={() => setCurrentView('data')}
          >
            <span className="nav-item-icon">📝</span>
            <span>Data Browser</span>
          </div>
          <div
            className={`nav-item ${currentView === 'query' ? 'active' : ''}`}
            onClick={() => setCurrentView('query')}
          >
            <span className="nav-item-icon">⚡</span>
            <span>SQL Query</span>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="btn btn-secondary btn-block" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="content-header">
          <h2>
            {currentView === 'tables' && '📊 Tables'}
            {currentView === 'data' && `📝 Data Browser${selectedTable ? ` - ${selectedTable}` : ''}`}
            {currentView === 'query' && '⚡ SQL Query'}
          </h2>
        </div>

        <div className="content-body">
          {currentView === 'tables' && (
            <TablesView
              apiClient={apiClient}
              onTableSelect={handleTableSelect}
            />
          )}

          {currentView === 'data' && (
            selectedTable ? (
              <DataBrowser
                apiClient={apiClient}
                tableName={selectedTable}
                apiKey={apiKey}
              />
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <div className="empty-state-text">Select a Table</div>
                <div className="empty-state-subtext">Choose a table from the Tables view to browse its data</div>
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentView('tables')}
                >
                  Go to Tables
                </button>
              </div>
            )
          )}

          {currentView === 'query' && (
            <QueryEditor apiClient={apiClient} />
          )}
        </div>
      </div>
    </div>
  );
}

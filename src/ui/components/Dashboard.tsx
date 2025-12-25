import { useState } from 'preact/hooks';
import { ApiClient } from '../lib/api';
import { TablesView } from './Tables';
import { DataBrowser } from './DataBrowser';
import { QueryEditor } from './QueryEditor';
import { ApiKeyManagement } from './ApiKeyManagement';
import { Database, FileText, Zap, Key, LogOut, Table2 } from 'lucide-preact';

interface DashboardProps {
  apiKey: string;
  onLogout: () => void;
}

export function Dashboard({ apiKey, onLogout }: DashboardProps) {
  const [currentView, setCurrentView] = useState<'tables' | 'data' | 'query' | 'keys'>('tables');
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
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">
            <Database size={28} strokeWidth={2.5} />
            <h1 style="font-size: 1.5em; margin: 0;">D1 SQL Studio</h1>
          </div>
          <p style="font-size: 0.9em; margin: 0; opacity: 0.9;">Database Management Platform</p>
        </div>

        <div className="sidebar-nav">
          <div
            className={`nav-item ${currentView === 'tables' ? 'active' : ''}`}
            onClick={() => setCurrentView('tables')}
          >
            <Table2 size={20} className="nav-item-icon" />
            <span>Tables</span>
          </div>
          <div
            className={`nav-item ${currentView === 'data' ? 'active' : ''}`}
            onClick={() => setCurrentView('data')}
          >
            <FileText size={20} className="nav-item-icon" />
            <span>Data Browser</span>
          </div>
          <div
            className={`nav-item ${currentView === 'query' ? 'active' : ''}`}
            onClick={() => setCurrentView('query')}
          >
            <Zap size={20} className="nav-item-icon" />
            <span>SQL Query</span>
          </div>
          <div
            className={`nav-item ${currentView === 'keys' ? 'active' : ''}`}
            onClick={() => setCurrentView('keys')}
          >
            <Key size={20} className="nav-item-icon" />
            <span>API Keys</span>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="btn btn-secondary btn-block" onClick={onLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="content-header">
          <h2 style="display: flex; align-items: center; gap: 12px; margin: 0;">
            {currentView === 'tables' && <><Table2 size={24} /> Tables</>}
            {currentView === 'data' && <><FileText size={24} /> Data Browser{selectedTable && ` - ${selectedTable}`}</>}
            {currentView === 'query' && <><Zap size={24} /> SQL Query</>}
            {currentView === 'keys' && <><Key size={24} /> API Keys</>}
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

          {currentView === 'keys' && (
            <ApiKeyManagement apiClient={apiClient} />
          )}
        </div>
      </div>
    </div>
  );
}

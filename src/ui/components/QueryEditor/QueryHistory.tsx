import { useState, useEffect } from 'preact/hooks';
import { QueryHistoryManager, QueryHistoryItem } from '../../lib/queryHistory';
import { Button } from '../shared';

interface QueryHistoryProps {
  onSelectQuery: (query: string) => void;
  onClose: () => void;
}

export function QueryHistory({ onSelectQuery, onClose }: QueryHistoryProps) {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = () => {
    let items: QueryHistoryItem[];
    if (filter === 'success') {
      items = QueryHistoryManager.getSuccessfulQueries();
    } else if (filter === 'failed') {
      items = QueryHistoryManager.getFailedQueries();
    } else {
      items = QueryHistoryManager.getHistory();
    }
    setHistory(items);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      const results = QueryHistoryManager.searchHistory(term);
      setHistory(results);
    } else {
      loadHistory();
    }
  };

  const handleDelete = (id: string) => {
    QueryHistoryManager.deleteItem(id);
    loadHistory();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all query history?')) {
      QueryHistoryManager.clearHistory();
      loadHistory();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Query History</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div style="display: flex; gap: 12px; margin-bottom: 20px;">
            <input
              type="text"
              className="form-control"
              placeholder="Search queries..."
              value={searchTerm}
              onInput={(e) => handleSearch((e.target as HTMLInputElement).value)}
              style="flex: 1;"
            />

            <div style="display: flex; gap: 8px;">
              <Button
                variant={filter === 'all' ? 'primary' : 'secondary'}
                className="btn-sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'success' ? 'success' : 'secondary'}
                className="btn-sm"
                onClick={() => setFilter('success')}
              >
                Success
              </Button>
              <Button
                variant={filter === 'failed' ? 'danger' : 'secondary'}
                className="btn-sm"
                onClick={() => setFilter('failed')}
              >
                Failed
              </Button>
            </div>

            <Button
              variant="warning"
              className="btn-sm"
              onClick={handleClearAll}
            >
              Clear All
            </Button>
          </div>

          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📜</div>
              <div className="empty-state-text">No query history</div>
              <div className="empty-state-subtext">
                {searchTerm ? 'No queries found matching your search' : 'Your executed queries will appear here'}
              </div>
            </div>
          ) : (
            <div style="display: flex; flex-direction: column; gap: 12px;">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="card"
                  style="margin: 0; padding: 16px; cursor: pointer; transition: all 0.2s;"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '';
                  }}
                >
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px; gap: 12px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                      <span className={`badge ${item.success ? 'badge-success' : 'badge-danger'}`}>
                        {item.success ? '✓' : '✗'}
                      </span>
                      <span style="color: var(--text-light); font-size: 13px;">
                        {formatTimestamp(item.timestamp)}
                      </span>
                      {item.rowCount !== undefined && (
                        <span style="color: var(--text-light); font-size: 13px;">
                          {item.rowCount} rows
                        </span>
                      )}
                      {item.duration && (
                        <span style="color: var(--text-light); font-size: 13px;">
                          {item.duration}
                        </span>
                      )}
                    </div>
                    <div style="display: flex; gap: 8px; flex-shrink: 0;">
                      <Button
                        variant="primary"
                        className="btn-sm"
                        onClick={() => {
                          onSelectQuery(item.query);
                          onClose();
                        }}
                      >
                        Use Query
                      </Button>
                      <Button
                        variant="danger"
                        className="btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  <pre style="margin: 0; padding: 12px; background: var(--bg); border-radius: 6px; font-size: 13px; line-height: 1.5; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;">
                    <code>{item.query}</code>
                  </pre>

                  {item.error && (
                    <div style="margin-top: 10px; padding: 10px; background: rgba(251, 113, 133, 0.1); border-left: 3px solid var(--danger); border-radius: 4px;">
                      <span style="color: var(--danger-dark); font-size: 13px;">
                        {item.error}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

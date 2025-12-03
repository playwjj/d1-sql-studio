import { useState, useEffect } from 'preact/hooks';
import { ApiClient } from '../../lib/api';

interface ApiDocumentationProps {
  tableName: string;
  apiUrl: string;
  apiKey: string;
  apiClient: ApiClient;
}

export function ApiDocumentation({ tableName, apiUrl, apiKey, apiClient }: ApiDocumentationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [columns, setColumns] = useState<any[]>([]);

  useEffect(() => {
    if (isExpanded && columns.length === 0) {
      loadSchema();
    }
  }, [isExpanded]);

  const loadSchema = async () => {
    try {
      const result = await apiClient.getTableSchema(tableName);
      if (result.success && result.data && Array.isArray(result.data)) {
        setColumns(result.data);
      }
    } catch (err) {
      console.error('Failed to load schema:', err);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const baseUrl = apiUrl || window.location.origin;

  // Get example columns (non-primary key columns for insert/update)
  const exampleColumns = columns.filter(col => !col.pk).slice(0, 2);
  const hasColumns = exampleColumns.length > 0;

  // Generate example data based on real columns
  const getExampleValue = (type: string) => {
    const upperType = type.toUpperCase();
    if (upperType.includes('INT')) return '123';
    if (upperType.includes('REAL') || upperType.includes('FLOAT')) return '99.99';
    if (upperType.includes('BOOL')) return 'true';
    if (upperType.includes('DATE')) return '2024-01-01';
    return '"example_value"';
  };

  const insertFields = hasColumns
    ? exampleColumns.map(col => `  "${col.name}": ${getExampleValue(col.type)}`).join(',\n')
    : '  "column1": "value1",\n  "column2": "value2"';

  const updateFields = hasColumns && exampleColumns[0]
    ? `  "${exampleColumns[0].name}": ${getExampleValue(exampleColumns[0].type)}`
    : '  "column1": "new_value"';

  const examples = [
    {
      id: 'list',
      title: 'Get Table Data (Paginated)',
      method: 'GET',
      curl: `curl -X GET "${baseUrl}/api/tables/${tableName}/rows?page=1&limit=50" \\
  -H "Authorization: Bearer ${apiKey}"`,
      description: 'Fetch paginated rows from the table',
      response: `{
  "success": true,
  "data": [ /* array of rows */ ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 150
  }
}`
    },
    {
      id: 'schema',
      title: 'Get Table Schema',
      method: 'GET',
      curl: `curl -X GET "${baseUrl}/api/tables/${tableName}/schema" \\
  -H "Authorization: Bearer ${apiKey}"`,
      description: 'Get table structure and column information',
      response: `{
  "success": true,
  "data": [
    {
      "name": "id",
      "type": "INTEGER",
      "notnull": 1,
      "pk": 1
    }
  ]
}`
    },
    {
      id: 'insert',
      title: 'Insert Row',
      method: 'POST',
      curl: `curl -X POST "${baseUrl}/api/tables/${tableName}/rows" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
${insertFields}
}'`,
      description: 'Add a new row to the table',
      response: `{
  "success": true,
  "data": { /* inserted row data */ }
}`
    },
    {
      id: 'update',
      title: 'Update Row',
      method: 'PUT',
      curl: `curl -X PUT "${baseUrl}/api/tables/${tableName}/rows/1" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
${updateFields}
}'`,
      description: 'Update an existing row by ID',
      response: `{
  "success": true,
  "data": { /* updated row data */ }
}`
    },
    {
      id: 'delete',
      title: 'Delete Row',
      method: 'DELETE',
      curl: `curl -X DELETE "${baseUrl}/api/tables/${tableName}/rows/1" \\
  -H "Authorization: Bearer ${apiKey}"`,
      description: 'Delete a row by ID',
      response: `{
  "success": true
}`
    }
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return '#0ea5e9';
      case 'POST': return '#10b981';
      case 'PUT': return '#f59e0b';
      case 'DELETE': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="api-docs-container" style="margin-bottom: 20px;">
      <button
        className="api-docs-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text-primary)',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = 'var(--hover-bg)')}
        onMouseOut={(e) => (e.currentTarget.style.background = 'var(--card-bg)')}
      >
        <span>📚 REST API Documentation</span>
        <span style={{ fontSize: '12px' }}>{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div
          className="api-docs-content"
          style={{
            marginTop: '12px',
            padding: '16px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px'
          }}
        >
          <p style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Use these endpoints to interact with the <strong>{tableName}</strong> table via REST API.
          </p>

          {examples.map((example) => (
            <div
              key={example.id}
              style={{
                marginBottom: '20px',
                paddingBottom: '20px',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span
                  className="method-badge"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#fff',
                    background: getMethodColor(example.method)
                  }}
                >
                  {example.method}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{example.title}</span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {example.description}
              </p>

              <div
                style={{
                  position: 'relative',
                  background: '#000',
                  padding: '16px',
                  paddingRight: '90px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                  overflow: 'auto'
                }}
              >
                <button
                  onClick={() => handleCopy(example.curl, example.id)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '6px 12px',
                    background: copied === example.id ? '#10b981' : '#333',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (copied !== example.id) {
                      e.currentTarget.style.background = '#555';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (copied !== example.id) {
                      e.currentTarget.style.background = '#333';
                    }
                  }}
                >
                  {copied === example.id ? '✓ Copied' : '📋 Copy'}
                </button>
                <pre style={{
                  margin: 0,
                  padding: 0,
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {example.curl}
                </pre>
              </div>

              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Response:
                </div>
                <div
                  style={{
                    background: '#000',
                    padding: '16px',
                    borderRadius: '6px',
                    border: '1px solid #333',
                    overflow: 'auto'
                  }}
                >
                  <pre style={{
                    margin: 0,
                    padding: 0,
                    background: 'none',
                    border: 'none',
                    color: '#4ade80',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}>
                    {example.response}
                  </pre>
                </div>
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: 'rgba(56, 139, 253, 0.1)',
              border: '1px solid rgba(56, 139, 253, 0.3)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--text-primary)'
            }}
          >
            <strong>💡 Tip:</strong> Replace the API key in examples with your actual key for authentication.
          </div>
        </div>
      )}
    </div>
  );
}

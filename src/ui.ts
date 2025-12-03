export function getAdminUI(): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>D1 SQL Studio - Database Manager</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root[data-theme="light"] {
            --primary: #667eea;
            --primary-dark: #5a67d8;
            --secondary: #764ba2;
            --success: #48bb78;
            --danger: #f56565;
            --warning: #ed8936;
            --bg: #f7fafc;
            --card-bg: #ffffff;
            --text: #2d3748;
            --text-light: #718096;
            --border: #e2e8f0;
            --hover-bg: #edf2f7;
            --shadow: rgba(0,0,0,0.05);
        }

        :root[data-theme="dark"] {
            --primary: #7c3aed;
            --primary-dark: #6d28d9;
            --secondary: #a855f7;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
            --bg: #111827;
            --card-bg: #1f2937;
            --text: #f9fafb;
            --text-light: #9ca3af;
            --border: #374151;
            --hover-bg: #374151;
            --shadow: rgba(0,0,0,0.3);
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            transition: background-color 0.3s ease, color 0.3s ease;
        }

        .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
        }

        .login-box {
            background: var(--card-bg);
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 20px 60px var(--shadow);
            width: 100%;
            max-width: 400px;
        }

        .login-box h1 {
            color: var(--primary);
            margin-bottom: 10px;
            font-size: 2em;
        }

        .login-box p {
            color: var(--text-light);
            margin-bottom: 30px;
        }

        .app-container {
            display: none;
            min-height: 100vh;
        }

        .app-container.active {
            display: flex;
        }

        .sidebar {
            width: 280px;
            background: var(--card-bg);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            transition: background-color 0.3s ease;
        }

        .sidebar-header {
            padding: 20px;
            border-bottom: 1px solid var(--border);
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: white;
        }

        .sidebar-header h1 {
            font-size: 1.3em;
            margin-bottom: 5px;
        }

        .sidebar-header p {
            font-size: 0.85em;
            opacity: 0.9;
        }

        .sidebar-nav {
            flex: 1;
            padding: 20px 0;
        }

        .nav-item {
            padding: 12px 20px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 10px;
            border-left: 3px solid transparent;
        }

        .nav-item:hover {
            background: var(--hover-bg);
        }

        .nav-item.active {
            background: var(--hover-bg);
            border-left-color: var(--primary);
            color: var(--primary);
            font-weight: 500;
        }

        .nav-item-icon {
            font-size: 1.2em;
        }

        .sidebar-footer {
            padding: 20px;
            border-top: 1px solid var(--border);
        }

        .theme-toggle {
            margin-bottom: 10px;
        }

        .main-content {
            flex: 1;
            overflow: auto;
        }

        .content-header {
            background: var(--card-bg);
            padding: 20px 30px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 15px;
            transition: background-color 0.3s ease;
        }

        .content-header h2 {
            font-size: 1.5em;
            color: var(--text);
        }

        .content-body {
            padding: 30px;
        }

        .toolbar {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }

        .search-box {
            position: relative;
            flex: 1;
            min-width: 200px;
        }

        .search-box input {
            width: 100%;
            padding: 8px 35px 8px 12px;
            border: 1px solid var(--border);
            border-radius: 6px;
            background: var(--bg);
            color: var(--text);
        }

        .search-box::after {
            content: '🔍';
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--text);
        }

        .form-control {
            width: 100%;
            padding: 10px 15px;
            border: 1px solid var(--border);
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
            background: var(--bg);
            color: var(--text);
        }

        .form-control:focus {
            outline: none;
            border-color: var(--primary);
        }

        textarea.form-control {
            min-height: 100px;
            font-family: 'Courier New', monospace;
        }

        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px var(--shadow);
        }

        .btn:active {
            transform: translateY(0);
        }

        .btn-primary {
            background: var(--primary);
            color: white;
        }

        .btn-primary:hover {
            background: var(--primary-dark);
        }

        .btn-success {
            background: var(--success);
            color: white;
        }

        .btn-danger {
            background: var(--danger);
            color: white;
        }

        .btn-secondary {
            background: var(--text-light);
            color: white;
        }

        .btn-sm {
            padding: 6px 12px;
            font-size: 12px;
        }

        .btn-block {
            width: 100%;
            justify-content: center;
        }

        .card {
            background: var(--card-bg);
            border-radius: 8px;
            box-shadow: 0 2px 4px var(--shadow);
            margin-bottom: 20px;
            transition: background-color 0.3s ease;
        }

        .card-header {
            padding: 15px 20px;
            border-bottom: 1px solid var(--border);
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .card-body {
            padding: 20px;
        }

        .table-responsive {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }

        th {
            background: var(--bg);
            padding: 12px;
            text-align: left;
            font-weight: 500;
            border-bottom: 2px solid var(--border);
            white-space: nowrap;
            cursor: pointer;
            user-select: none;
            position: relative;
        }

        th:hover {
            background: var(--hover-bg);
        }

        th.sortable::after {
            content: '⇅';
            margin-left: 5px;
            opacity: 0.3;
        }

        th.sort-asc::after {
            content: '↑';
            opacity: 1;
        }

        th.sort-desc::after {
            content: '↓';
            opacity: 1;
        }

        td {
            padding: 12px;
            border-bottom: 1px solid var(--border);
        }

        tr:hover {
            background: var(--hover-bg);
        }

        .alert {
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .alert-success {
            background: #c6f6d5;
            color: #22543d;
            border: 1px solid #9ae6b4;
        }

        .alert-danger {
            background: #fed7d7;
            color: #742a2a;
            border: 1px solid #fc8181;
        }

        .alert-info {
            background: #bee3f8;
            color: #2c5282;
            border: 1px solid #90cdf4;
        }

        .alert-warning {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fbbf24;
        }

        [data-theme="dark"] .alert-success {
            background: #065f46;
            color: #d1fae5;
            border-color: #059669;
        }

        [data-theme="dark"] .alert-danger {
            background: #7f1d1d;
            color: #fecaca;
            border-color: #dc2626;
        }

        [data-theme="dark"] .alert-info {
            background: #1e3a8a;
            color: #dbeafe;
            border-color: #2563eb;
        }

        [data-theme="dark"] .alert-warning {
            background: #78350f;
            color: #fef3c7;
            border-color: #f59e0b;
        }

        .db-setup-guide {
            margin-top: 20px;
            padding: 20px;
            background: var(--bg);
            border-radius: 8px;
            border-left: 4px solid var(--warning);
        }

        .db-setup-guide h4 {
            color: var(--warning);
            margin-bottom: 15px;
        }

        .db-setup-guide ol {
            margin-left: 20px;
            line-height: 1.8;
        }

        .db-setup-guide code {
            background: var(--card-bg);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            border: 1px solid var(--border);
        }

        .db-setup-guide a {
            color: var(--primary);
            text-decoration: none;
        }

        .db-setup-guide a:hover {
            text-decoration: underline;
        }

        .pagination {
            display: flex;
            gap: 10px;
            align-items: center;
            justify-content: center;
            margin-top: 20px;
        }

        .pagination button {
            padding: 8px 12px;
            border: 1px solid var(--border);
            background: var(--card-bg);
            color: var(--text);
            border-radius: 4px;
            cursor: pointer;
        }

        .pagination button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .pagination span {
            color: var(--text-light);
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: var(--text-light);
        }

        .spinner {
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 4px solid var(--border);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .view {
            display: none;
        }

        .view.active {
            display: block;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: var(--card-bg);
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px var(--shadow);
            transition: background-color 0.3s ease;
        }

        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: var(--primary);
        }

        .stat-label {
            color: var(--text-light);
            font-size: 0.9em;
            margin-top: 5px;
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background: var(--card-bg);
            padding: 30px;
            border-radius: 12px;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow: auto;
        }

        .modal-header {
            margin-bottom: 20px;
        }

        .modal-header h3 {
            font-size: 1.5em;
            color: var(--text);
        }

        .modal-footer {
            margin-top: 20px;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }

        .code-editor {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
        }

        .action-buttons {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }

        .hidden {
            display: none !important;
        }

        .kbd {
            display: inline-block;
            padding: 2px 6px;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.85em;
        }

        .tooltip {
            position: relative;
        }

        .tooltip:hover::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: var(--text);
            color: var(--card-bg);
            padding: 5px 10px;
            border-radius: 4px;
            white-space: nowrap;
            font-size: 12px;
            margin-bottom: 5px;
        }

        @media (max-width: 768px) {
            .sidebar {
                width: 100%;
                max-width: 250px;
            }

            .content-header {
                flex-direction: column;
                align-items: flex-start;
            }
        }

        /* Visual Table Designer Styles */
        .table-builder-container {
            max-height: 70vh;
            overflow-y: auto;
            padding: 10px;
        }

        .fields-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .field-row {
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 15px;
            background: var(--bg);
            position: relative;
        }

        .field-row-content {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr auto;
            gap: 15px;
            align-items: start;
        }

        .field-row .form-group {
            margin-bottom: 0;
        }

        .field-row .form-group label {
            font-size: 0.85em;
            margin-bottom: 5px;
        }

        .field-row .remove-field {
            margin-top: 22px;
        }

        .pk-field-item {
            padding: 8px;
            background: var(--hover-bg);
            border-radius: 4px;
            margin-bottom: 5px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        #existingFields {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .existing-field-item {
            padding: 12px;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .field-info {
            flex: 1;
        }

        .field-name-display {
            font-weight: 600;
            color: var(--primary);
        }

        .field-type-display {
            color: var(--text-light);
            font-size: 0.9em;
        }

        .field-constraints {
            display: flex;
            gap: 5px;
            margin-top: 5px;
        }

        .constraint-badge {
            padding: 2px 8px;
            background: var(--primary);
            color: white;
            border-radius: 3px;
            font-size: 0.75em;
        }

        @media (max-width: 768px) {
            .field-row-content {
                grid-template-columns: 1fr;
            }

            .field-row .remove-field {
                margin-top: 0;
            }
        }
    </style>
</head>
<body>
    <div id="loginPage" class="login-container">
        <div class="login-box">
            <h1>🗄️ D1 SQL Studio</h1>
            <p>Database Management Interface</p>

            <div id="loginError" class="alert alert-danger hidden">
                <span>⚠️</span>
                <span id="loginErrorText">Invalid API Key</span>
            </div>

            <form id="loginForm">
                <div class="form-group">
                    <label for="apiKey">API Key</label>
                    <input type="password" id="apiKey" class="form-control" placeholder="Enter your API key" required>
                </div>
                <button type="submit" class="btn btn-primary btn-block">
                    🔐 Login
                </button>
            </form>
        </div>
    </div>

    <div id="appContainer" class="app-container">
        <div class="sidebar">
            <div class="sidebar-header">
                <h1>🗄️ D1 SQL Studio</h1>
                <p>Database Manager</p>
            </div>

            <div class="sidebar-nav">
                <div class="nav-item active" data-view="tables">
                    <span class="nav-item-icon">📊</span>
                    <span>Tables</span>
                </div>
                <div class="nav-item" data-view="data">
                    <span class="nav-item-icon">📝</span>
                    <span>Data Browser</span>
                </div>
                <div class="nav-item" data-view="query">
                    <span class="nav-item-icon">⚡</span>
                    <span>SQL Query</span>
                </div>
            </div>

            <div class="sidebar-footer">
                <button class="btn btn-secondary btn-block theme-toggle" id="themeToggle">
                    🌙 Dark Mode
                </button>
                <button class="btn btn-secondary btn-block" id="logoutBtn">
                    🚪 Logout
                </button>
            </div>
        </div>

        <div class="main-content">
            <div id="tablesView" class="view active">
                <div class="content-header">
                    <h2>📊 Tables</h2>
                    <div class="action-buttons">
                        <button class="btn btn-success" id="visualTableBtn">
                            🎨 Visual Builder
                        </button>
                        <button class="btn btn-primary" id="createTableBtn">
                            📝 SQL Editor
                        </button>
                        <button class="btn btn-secondary" id="manageFieldsBtn">
                            ⚙️ Manage Fields
                        </button>
                    </div>
                </div>
                <div class="content-body">
                    <div id="tablesContent"></div>
                </div>
            </div>

            <div id="dataView" class="view">
                <div class="content-header">
                    <h2>📝 Data Browser</h2>
                    <div class="toolbar">
                        <select id="tableSelect" class="form-control" style="width: 200px;">
                            <option value="">Select a table...</option>
                        </select>
                        <div class="search-box">
                            <input type="text" id="dataSearch" class="form-control" placeholder="Search data...">
                        </div>
                        <button class="btn btn-success" id="addRowBtn">➕ Add Row</button>
                        <button class="btn btn-primary" id="exportBtn" title="Export data">
                            📥 Export
                        </button>
                    </div>
                </div>
                <div class="content-body">
                    <div id="dataContent"></div>
                </div>
            </div>

            <div id="queryView" class="view">
                <div class="content-header">
                    <h2>⚡ SQL Query</h2>
                    <div class="action-buttons">
                        <button class="btn btn-primary" id="executeQueryBtn">
                            ▶️ Execute <span class="kbd">Ctrl+Enter</span>
                        </button>
                        <button class="btn btn-success" id="exportQueryBtn">
                            📥 Export Results
                        </button>
                    </div>
                </div>
                <div class="content-body">
                    <div class="card">
                        <div class="card-body">
                            <div class="form-group">
                                <label for="sqlEditor">SQL Query</label>
                                <textarea id="sqlEditor" class="form-control code-editor" rows="10" placeholder="SELECT * FROM users;"></textarea>
                            </div>
                        </div>
                    </div>
                    <div id="queryResults"></div>
                </div>
            </div>
        </div>
    </div>

    <div id="createTableModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Create New Table</h3>
            </div>
            <div class="form-group">
                <label for="createTableSQL">SQL Statement</label>
                <textarea id="createTableSQL" class="form-control code-editor" rows="8" placeholder="CREATE TABLE users (&#10;  id INTEGER PRIMARY KEY AUTOINCREMENT,&#10;  name TEXT NOT NULL,&#10;  email TEXT&#10;);"></textarea>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('createTableModal')">Cancel</button>
                <button class="btn btn-primary" id="submitCreateTable">Create</button>
            </div>
        </div>
    </div>

    <div id="rowModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="rowModalTitle">Add Row</h3>
            </div>
            <div id="rowFormContent"></div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('rowModal')">Cancel</button>
                <button class="btn btn-primary" id="submitRow">Save</button>
            </div>
        </div>
    </div>

    <div id="exportModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Export Data</h3>
            </div>
            <div class="form-group">
                <label>Export Format</label>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="exportData('csv')">📄 CSV</button>
                    <button class="btn btn-primary" onclick="exportData('json')">📋 JSON</button>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('exportModal')">Close</button>
            </div>
        </div>
    </div>

    <!-- Visual Table Builder Modal -->
    <div id="visualTableBuilder" class="modal">
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <h3>📐 Visual Table Builder</h3>
            </div>

            <div class="table-builder-container">
                <!-- Table Name -->
                <div class="form-group">
                    <label for="builderTableName">Table Name *</label>
                    <input type="text" id="builderTableName" class="form-control" placeholder="e.g., users, products, orders" required>
                </div>

                <!-- Fields Section -->
                <div class="card">
                    <div class="card-header">
                        <span>Fields</span>
                        <button class="btn btn-sm btn-success" id="addFieldBtn">➕ Add Field</button>
                    </div>
                    <div class="card-body">
                        <div id="fieldsList" class="fields-list">
                            <!-- Fields will be added here dynamically -->
                        </div>
                    </div>
                </div>

                <!-- Primary Key Configuration -->
                <div class="card">
                    <div class="card-header">Primary Key Configuration</div>
                    <div class="card-body">
                        <div class="form-group">
                            <label>
                                <input type="radio" name="pkType" value="single" checked>
                                Single Field Primary Key
                            </label>
                            <select id="pkFieldSelect" class="form-control" style="margin-top: 10px;">
                                <option value="">Select field...</option>
                            </select>
                            <label style="margin-top: 10px;">
                                <input type="checkbox" id="pkAutoIncrement">
                                Auto Increment (for INTEGER only)
                            </label>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="radio" name="pkType" value="composite">
                                Composite Primary Key
                            </label>
                            <div id="compositePkFields" style="margin-top: 10px;">
                                <small>Select multiple fields for composite key</small>
                                <div id="compositePkList"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="radio" name="pkType" value="none">
                                No Primary Key
                            </label>
                        </div>
                    </div>
                </div>

                <!-- SQL Preview -->
                <div class="card">
                    <div class="card-header">📝 Generated SQL</div>
                    <div class="card-body">
                        <textarea id="sqlPreview" class="form-control code-editor" rows="12" readonly></textarea>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('visualTableBuilder')">Cancel</button>
                <button class="btn btn-primary" id="executeTableBuilder">Create Table</button>
            </div>
        </div>
    </div>

    <!-- Field Manager Modal -->
    <div id="fieldManager" class="modal">
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3>⚙️ Manage Table Fields</h3>
            </div>

            <div class="form-group">
                <label for="manageTableSelect">Select Table</label>
                <select id="manageTableSelect" class="form-control">
                    <option value="">Select a table...</option>
                </select>
            </div>

            <div id="currentFieldsList" class="card">
                <div class="card-header">Current Fields</div>
                <div class="card-body">
                    <div id="existingFields"></div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">➕ Add New Field</div>
                <div class="card-body">
                    <div class="form-group">
                        <label>Field Name</label>
                        <input type="text" id="newFieldName" class="form-control" placeholder="e.g., email, phone, status">
                    </div>
                    <div class="form-group">
                        <label>Field Type</label>
                        <select id="newFieldType" class="form-control">
                            <option value="TEXT">TEXT</option>
                            <option value="INTEGER">INTEGER</option>
                            <option value="REAL">REAL</option>
                            <option value="BLOB">BLOB</option>
                            <option value="UUID">UUID (TEXT)</option>
                            <option value="DATETIME">DATETIME (TEXT)</option>
                            <option value="DATE">DATE (TEXT)</option>
                            <option value="BOOLEAN">BOOLEAN (INTEGER)</option>
                            <option value="JSON">JSON (TEXT)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="newFieldNotNull">
                            NOT NULL
                        </label>
                        <label style="margin-left: 20px;">
                            <input type="checkbox" id="newFieldUnique">
                            UNIQUE
                        </label>
                    </div>
                    <div class="form-group">
                        <label>Default Value (optional)</label>
                        <input type="text" id="newFieldDefault" class="form-control" placeholder="e.g., CURRENT_TIMESTAMP, 0, 'active'">
                    </div>
                    <button class="btn btn-success" id="addNewFieldBtn">Add Field to Table</button>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('fieldManager')">Close</button>
            </div>
        </div>
    </div>

    <!-- Field Row Template -->
    <template id="fieldRowTemplate">
        <div class="field-row">
            <div class="field-row-content">
                <div class="form-group">
                    <label>Field Name *</label>
                    <input type="text" class="form-control field-name" placeholder="e.g., email" required>
                </div>
                <div class="form-group">
                    <label>Type *</label>
                    <select class="form-control field-type">
                        <option value="INTEGER">INTEGER - Whole numbers</option>
                        <option value="TEXT">TEXT - Strings and text</option>
                        <option value="REAL">REAL - Decimal numbers</option>
                        <option value="BLOB">BLOB - Binary data</option>
                        <option value="UUID">UUID - Unique identifier (TEXT)</option>
                        <option value="DATETIME">DATETIME - Date and time (TEXT)</option>
                        <option value="DATE">DATE - Date only (TEXT)</option>
                        <option value="TIME">TIME - Time only (TEXT)</option>
                        <option value="BOOLEAN">BOOLEAN - True/False (INTEGER)</option>
                        <option value="JSON">JSON - JSON data (TEXT)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Constraints</label>
                    <div>
                        <label><input type="checkbox" class="field-notnull"> NOT NULL</label>
                        <label><input type="checkbox" class="field-unique"> UNIQUE</label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Default Value</label>
                    <input type="text" class="form-control field-default" placeholder="Optional">
                    <small>Examples: CURRENT_TIMESTAMP, 0, 'active', NULL</small>
                </div>
                <button class="btn btn-danger btn-sm remove-field">🗑️ Remove</button>
            </div>
        </div>
    </template>

    <script>
        let API_KEY = '';
        let currentTable = '';
        let currentPage = 1;
        let rowModalMode = 'add';
        let editingRowId = null;
        let currentData = [];
        let filteredData = [];
        let sortColumn = null;
        let sortDirection = 'asc';
        let currentTableSchema = []; // Store current table schema for Add/Edit operations

        const API_BASE = '';

        // Visual Table Builder Variables
        let tableFields = [];
        let fieldCounter = 0;

        // Generate UUID v4
        function generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        // Theme Management
        function initTheme() {
            const savedTheme = localStorage.getItem('theme') || 'light';
            setTheme(savedTheme);
        }

        function setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            const btn = document.getElementById('themeToggle');
            if (btn) {
                btn.innerHTML = theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
            }
        }

        function toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme');
            setTheme(current === 'light' ? 'dark' : 'light');
        }

        // Visual Table Builder Functions
        function initializeTableBuilder() {
            document.getElementById('addFieldBtn').addEventListener('click', addFieldRow);
            document.getElementById('executeTableBuilder').addEventListener('click', createTableFromBuilder);

            // Add initial field
            addFieldRow();

            // Listen for changes to update preview
            document.getElementById('builderTableName').addEventListener('input', updateSQLPreview);
            document.addEventListener('change', (e) => {
                if (e.target.closest('#visualTableBuilder')) {
                    updateSQLPreview();
                }
            });

            // Primary key type change
            document.querySelectorAll('input[name="pkType"]').forEach(radio => {
                radio.addEventListener('change', updateSQLPreview);
            });
        }

        function addFieldRow() {
            const template = document.getElementById('fieldRowTemplate');
            const clone = template.content.cloneNode(true);
            const fieldRow = clone.querySelector('.field-row');

            fieldRow.dataset.fieldId = fieldCounter++;

            // Add event listeners
            fieldRow.querySelector('.remove-field').addEventListener('click', function() {
                fieldRow.remove();
                updateSQLPreview();
                updatePrimaryKeyOptions();
            });

            // Add change listeners
            fieldRow.querySelectorAll('input, select').forEach(input => {
                input.addEventListener('input', updateSQLPreview);
                input.addEventListener('change', () => {
                    updateSQLPreview();
                    updatePrimaryKeyOptions();
                });
            });

            document.getElementById('fieldsList').appendChild(fieldRow);
            updatePrimaryKeyOptions();
            updateSQLPreview();
        }

        function updatePrimaryKeyOptions() {
            const fields = Array.from(document.querySelectorAll('.field-row')).map(row => {
                return row.querySelector('.field-name').value || \`field_\${row.dataset.fieldId}\`;
            });

            const pkSelect = document.getElementById('pkFieldSelect');
            const currentValue = pkSelect.value;

            pkSelect.innerHTML = '<option value="">No primary key</option>';
            fields.forEach(fieldName => {
                if (fieldName) {
                    pkSelect.innerHTML += \`<option value="\${fieldName}">\${fieldName}</option>\`;
                }
            });

            if (currentValue && fields.includes(currentValue)) {
                pkSelect.value = currentValue;
            }

            // Update composite PK list
            const compositeList = document.getElementById('compositePkList');
            compositeList.innerHTML = '';
            fields.forEach(fieldName => {
                if (fieldName) {
                    compositeList.innerHTML += \`
                        <div class="pk-field-item">
                            <input type="checkbox" class="composite-pk-field" value="\${fieldName}">
                            <label>\${fieldName}</label>
                        </div>
                    \`;
                }
            });

            document.querySelectorAll('.composite-pk-field').forEach(cb => {
                cb.addEventListener('change', updateSQLPreview);
            });
        }

        function updateSQLPreview() {
            const tableName = document.getElementById('builderTableName').value || 'table_name';
            const fieldRows = document.querySelectorAll('.field-row');

            if (fieldRows.length === 0) {
                document.getElementById('sqlPreview').value = '-- Add at least one field';
                return;
            }

            let sql = \`CREATE TABLE \${tableName} (\\n\`;
            const fieldDefs = [];

            // Build field definitions
            fieldRows.forEach((row, index) => {
                const name = row.querySelector('.field-name').value || \`field_\${index + 1}\`;
                let type = row.querySelector('.field-type').value;

                // Map special types to SQLite types
                const typeMap = {
                    'UUID': 'TEXT',
                    'DATETIME': 'TEXT',
                    'DATE': 'TEXT',
                    'TIME': 'TEXT',
                    'BOOLEAN': 'INTEGER',
                    'JSON': 'TEXT'
                };

                type = typeMap[type] || type;

                let def = \`  \${name} \${type}\`;

                // Add constraints
                const notNull = row.querySelector('.field-notnull').checked;
                const unique = row.querySelector('.field-unique').checked;
                const defaultVal = row.querySelector('.field-default').value;

                if (notNull) def += ' NOT NULL';
                if (unique) def += ' UNIQUE';
                if (defaultVal) {
                    if (defaultVal.toUpperCase() === 'CURRENT_TIMESTAMP' || defaultVal.toUpperCase() === 'NULL') {
                        def += \` DEFAULT \${defaultVal}\`;
                    } else if (!isNaN(defaultVal)) {
                        def += \` DEFAULT \${defaultVal}\`;
                    } else {
                        def += \` DEFAULT '\${defaultVal}'\`;
                    }
                }

                fieldDefs.push(def);
            });

            sql += fieldDefs.join(',\\n');

            // Add primary key
            const pkType = document.querySelector('input[name="pkType"]:checked').value;

            if (pkType === 'single') {
                const pkField = document.getElementById('pkFieldSelect').value;
                if (pkField) {
                    const autoInc = document.getElementById('pkAutoIncrement').checked;
                    // Find the field and modify it
                    const pkIndex = Array.from(document.querySelectorAll('.field-name')).findIndex(
                        input => input.value === pkField
                    );
                    if (pkIndex !== -1) {
                        fieldDefs[pkIndex] += ' PRIMARY KEY';
                        if (autoInc) {
                            fieldDefs[pkIndex] += ' AUTOINCREMENT';
                        }
                    }
                    sql = \`CREATE TABLE \${tableName} (\\n\` + fieldDefs.join(',\\n');
                }
            } else if (pkType === 'composite') {
                const selectedFields = Array.from(document.querySelectorAll('.composite-pk-field:checked'))
                    .map(cb => cb.value);
                if (selectedFields.length > 0) {
                    sql += \`,\\n  PRIMARY KEY (\${selectedFields.join(', ')})\`;
                }
            }

            sql += '\\n);';

            document.getElementById('sqlPreview').value = sql;
        }

        async function createTableFromBuilder() {
            const sql = document.getElementById('sqlPreview').value;

            if (!sql || sql.includes('table_name') || sql.includes('field_')) {
                alert('Please fill in all required fields');
                return;
            }

            try {
                const result = await apiRequest('/api/tables', {
                    method: 'POST',
                    body: JSON.stringify({ sql }),
                });

                if (!result.success) throw new Error(result.error);

                closeModal('visualTableBuilder');
                alert('Table created successfully!');
                loadTables();

                // Reset builder
                document.getElementById('builderTableName').value = '';
                document.getElementById('fieldsList').innerHTML = '';
                fieldCounter = 0;
                addFieldRow();
            } catch (error) {
                alert(\`Error: \${error.message}\`);
            }
        }

        // Field Manager Functions
        function openFieldManager() {
            openModal('fieldManager');
            loadTablesForManager();
        }

        async function loadTablesForManager() {
            try {
                const result = await apiRequest('/api/tables');
                if (!result.success) throw new Error(result.error);

                const select = document.getElementById('manageTableSelect');
                select.innerHTML = '<option value="">Select a table...</option>';

                result.data.forEach(table => {
                    select.innerHTML += \`<option value="\${table.name}">\${table.name}</option>\`;
                });
            } catch (error) {
                console.error(error);
            }
        }

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter: Execute SQL
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const queryView = document.getElementById('queryView');
                if (queryView.classList.contains('active')) {
                    e.preventDefault();
                    document.getElementById('executeQueryBtn').click();
                }
            }

            // Escape: Close modals
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });

        async function apiRequest(endpoint, options = {}) {
            const response = await fetch(API_BASE + endpoint, {
                ...options,
                headers: {
                    'Authorization': \`Bearer \${API_KEY}\`,
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });
            return response.json();
        }

        function showView(viewName) {
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

            document.getElementById(viewName + 'View').classList.add('active');
            document.querySelector(\`[data-view="\${viewName}"]\`).classList.add('active');
        }

        function openModal(modalId) {
            document.getElementById(modalId).classList.add('active');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        function showLoading(containerId) {
            document.getElementById(containerId).innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
        }

        function showError(containerId, message) {
            document.getElementById(containerId).innerHTML = \`<div class="alert alert-danger"><span>⚠️</span><span>\${message}</span></div>\`;
        }

        function showSuccess(containerId, message) {
            const alert = \`<div class="alert alert-success"><span>✅</span><span>\${message}</span></div>\`;
            const container = document.getElementById(containerId);
            container.insertAdjacentHTML('afterbegin', alert);
            setTimeout(() => container.querySelector('.alert-success')?.remove(), 3000);
        }

        // Export Functions
        function exportData(format) {
            const data = filteredData.length > 0 ? filteredData : currentData;

            if (!data || data.length === 0) {
                alert('No data to export');
                return;
            }

            let content, filename, mimeType;

            if (format === 'csv') {
                content = convertToCSV(data);
                filename = \`\${currentTable}_\${Date.now()}.csv\`;
                mimeType = 'text/csv';
            } else if (format === 'json') {
                content = JSON.stringify(data, null, 2);
                filename = \`\${currentTable}_\${Date.now()}.json\`;
                mimeType = 'application/json';
            }

            downloadFile(content, filename, mimeType);
            closeModal('exportModal');
        }

        function convertToCSV(data) {
            if (!data || data.length === 0) return '';

            const headers = Object.keys(data[0]);
            const csvRows = [];

            csvRows.push(headers.join(','));

            for (const row of data) {
                const values = headers.map(header => {
                    const value = row[header];
                    if (value === null) return '';
                    const escaped = (''+value).replace(/"/g, '\\"');
                    return \`"\${escaped}"\`;
                });
                csvRows.push(values.join(','));
            }

            return csvRows.join('\\n');
        }

        function downloadFile(content, filename, mimeType) {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        // Sorting Functions
        function sortTable(column) {
            if (sortColumn === column) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = column;
                sortDirection = 'asc';
            }

            const dataToSort = filteredData.length > 0 ? filteredData : currentData;

            dataToSort.sort((a, b) => {
                let aVal = a[column];
                let bVal = b[column];

                if (aVal === null) aVal = '';
                if (bVal === null) bVal = '';

                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();

                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });

            if (filteredData.length > 0) {
                filteredData = dataToSort;
            } else {
                currentData = dataToSort;
            }

            renderTableData();
        }

        // Search/Filter Functions
        function filterData(searchTerm) {
            if (!searchTerm) {
                filteredData = [];
                renderTableData();
                return;
            }

            searchTerm = searchTerm.toLowerCase();
            filteredData = currentData.filter(row => {
                return Object.values(row).some(value => {
                    if (value === null) return false;
                    return String(value).toLowerCase().includes(searchTerm);
                });
            });

            renderTableData();
        }

        function renderTableData() {
            const data = filteredData.length > 0 ? filteredData : currentData;

            if (!data || data.length === 0) {
                document.getElementById('dataContent').innerHTML = '<div class="alert alert-info"><span>ℹ️</span><span>No data found.</span></div>';
                return;
            }

            const columns = Object.keys(data[0]);
            let html = '<div class="card"><div class="card-body"><div class="table-responsive"><table><thead><tr>';

            columns.forEach(col => {
                const sortClass = sortColumn === col ? (sortDirection === 'asc' ? 'sort-asc' : 'sort-desc') : 'sortable';
                html += \`<th class="\${sortClass}" onclick="sortTable('\${col}')">\${col}</th>\`;
            });
            html += '<th>Actions</th></tr></thead><tbody>';

            data.forEach(row => {
                html += '<tr>';
                columns.forEach(col => {
                    const value = row[col] === null ? '<em>NULL</em>' : row[col];
                    html += \`<td>\${value}</td>\`;
                });
                html += \`<td>
                    <button class="btn btn-primary btn-sm" onclick='editRow(\${JSON.stringify(row)})'>✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRow('\${row[columns[0]]}')">🗑️</button>
                </td></tr>\`;
            });

            html += '</tbody></table></div></div></div>';

            document.getElementById('dataContent').innerHTML = html;
        }

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const apiKey = document.getElementById('apiKey').value;

            try {
                API_KEY = apiKey;
                const result = await apiRequest('/api/tables');

                if (result.success) {
                    document.getElementById('loginPage').style.display = 'none';
                    document.getElementById('appContainer').classList.add('active');
                    localStorage.setItem('d1_api_key', apiKey);
                    initTheme();
                    loadTables();
                } else if (result.error === 'DATABASE_NOT_BOUND') {
                    // Show database setup guide
                    showDatabaseSetupGuide();
                } else {
                    throw new Error(result.error || 'Invalid API Key');
                }
            } catch (error) {
                document.getElementById('loginError').classList.remove('hidden');
                document.getElementById('loginErrorText').textContent = error.message;
            }
        });

        function showDatabaseSetupGuide() {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('appContainer').classList.add('active');
            localStorage.setItem('d1_api_key', document.getElementById('apiKey').value);
            initTheme();

            // Show database setup warning
            const setupGuideHTML = \`
                <div class="alert alert-warning">
                    <span>⚠️</span>
                    <span><strong>数据库未绑定</strong> - 请先绑定 D1 数据库才能使用此应用</span>
                </div>
                <div class="db-setup-guide">
                    <h4>📚 如何绑定 D1 数据库</h4>
                    <p>请按照以下步骤绑定数据库：</p>

                    <h5 style="margin-top: 20px; margin-bottom: 10px;">方法一：在 Cloudflare Dashboard 中绑定（推荐）</h5>
                    <ol>
                        <li>登录 <a href="https://dash.cloudflare.com/" target="_blank">Cloudflare Dashboard</a></li>
                        <li>进入 <strong>Workers & Pages</strong> 页面</li>
                        <li>找到并点击你的 Worker 项目（<code>d1-sql-studio</code>）</li>
                        <li>进入 <strong>Settings</strong> &gt; <strong>Bindings</strong></li>
                        <li>在 <strong>D1 Database Bindings</strong> 部分点击 <strong>Add binding</strong></li>
                        <li>设置：
                            <ul>
                                <li><strong>Variable name:</strong> <code>DB</code> (必须是 DB)</li>
                                <li><strong>D1 database:</strong> 选择现有数据库或创建新数据库</li>
                            </ul>
                        </li>
                        <li>点击 <strong>Save</strong> 保存</li>
                        <li>等待几秒钟让配置生效</li>
                        <li>刷新此页面重新登录</li>
                    </ol>

                    <h5 style="margin-top: 20px; margin-bottom: 10px;">方法二：在 wrangler.toml 中配置（本地开发）</h5>
                    <ol>
                        <li>创建 D1 数据库：<br><code>npx wrangler d1 create d1-sql-studio-db</code></li>
                        <li>复制输出的 <code>database_id</code></li>
                        <li>编辑 <code>wrangler.toml</code> 文件，取消注释并填写：
                            <pre style="background: var(--card-bg); padding: 10px; border-radius: 4px; margin-top: 10px;">[[d1_databases]]
binding = "DB"
database_name = "d1-sql-studio-db"
database_id = "你的-database-id"</pre>
                        </li>
                        <li>重启开发服务器：<code>npm run dev</code></li>
                    </ol>

                    <p style="margin-top: 20px;">
                        <strong>注意：</strong>完成绑定后，请刷新此页面以重新连接数据库。
                    </p>
                </div>
            \`;

            document.getElementById('tablesContent').innerHTML = setupGuideHTML;
            showView('tables');
        }

        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('d1_api_key');
            location.reload();
        });

        document.getElementById('themeToggle').addEventListener('click', toggleTheme);

        document.getElementById('exportBtn').addEventListener('click', () => {
            openModal('exportModal');
        });

        document.getElementById('dataSearch').addEventListener('input', (e) => {
            filterData(e.target.value);
        });

        // Visual Table Builder event listeners
        document.getElementById('visualTableBtn').addEventListener('click', () => {
            openModal('visualTableBuilder');
            // Reset and initialize the builder
            document.getElementById('builderTableName').value = '';
            document.getElementById('fieldsList').innerHTML = '';
            fieldCounter = 0;
            initializeTableBuilder();
        });

        document.getElementById('manageFieldsBtn').addEventListener('click', () => {
            openFieldManager();
        });

        // Field Manager event listeners
        document.getElementById('manageTableSelect')?.addEventListener('change', async (e) => {
            const tableName = e.target.value;
            if (!tableName) {
                document.getElementById('existingFields').innerHTML = '';
                return;
            }

            try {
                const result = await apiRequest(\`/api/tables/\${tableName}/schema\`);
                if (!result.success) throw new Error(result.error);

                let html = '';
                result.data.forEach(col => {
                    const constraints = [];
                    if (col.pk) constraints.push('PK');
                    if (col.notnull) constraints.push('NOT NULL');

                    html += \`
                        <div class="existing-field-item">
                            <div class="field-info">
                                <div class="field-name-display">\${col.name}</div>
                                <div class="field-type-display">\${col.type}</div>
                                <div class="field-constraints">
                                    \${constraints.map(c => \`<span class="constraint-badge">\${c}</span>\`).join('')}
                                </div>
                            </div>
                        </div>
                    \`;
                });

                document.getElementById('existingFields').innerHTML = html;
            } catch (error) {
                alert(error.message);
            }
        });

        document.getElementById('addNewFieldBtn')?.addEventListener('click', async () => {
            const tableName = document.getElementById('manageTableSelect').value;
            if (!tableName) {
                alert('Please select a table first');
                return;
            }

            const fieldName = document.getElementById('newFieldName').value.trim();
            if (!fieldName) {
                alert('Please enter a field name');
                return;
            }

            let fieldType = document.getElementById('newFieldType').value;

            // Map special types
            const typeMap = {
                'UUID': 'TEXT',
                'DATETIME': 'TEXT',
                'DATE': 'TEXT',
                'BOOLEAN': 'INTEGER',
                'JSON': 'TEXT'
            };
            fieldType = typeMap[fieldType] || fieldType;

            const notNull = document.getElementById('newFieldNotNull').checked;
            const unique = document.getElementById('newFieldUnique').checked;
            const defaultVal = document.getElementById('newFieldDefault').value.trim();

            let sql = \`ALTER TABLE \${tableName} ADD COLUMN \${fieldName} \${fieldType}\`;

            if (notNull) sql += ' NOT NULL';
            if (unique) sql += ' UNIQUE';
            if (defaultVal) {
                if (defaultVal.toUpperCase() === 'CURRENT_TIMESTAMP' || defaultVal.toUpperCase() === 'NULL') {
                    sql += \` DEFAULT \${defaultVal}\`;
                } else if (!isNaN(defaultVal)) {
                    sql += \` DEFAULT \${defaultVal}\`;
                } else {
                    sql += \` DEFAULT '\${defaultVal}'\`;
                }
            }

            try {
                const result = await apiRequest('/api/query', {
                    method: 'POST',
                    body: JSON.stringify({ sql }),
                });

                if (!result.success) throw new Error(result.error);

                alert(\`Field '\${fieldName}' added successfully!\`);

                // Refresh field list
                document.getElementById('manageTableSelect').dispatchEvent(new Event('change'));

                // Clear form
                document.getElementById('newFieldName').value = '';
                document.getElementById('newFieldType').value = 'TEXT';
                document.getElementById('newFieldNotNull').checked = false;
                document.getElementById('newFieldUnique').checked = false;
                document.getElementById('newFieldDefault').value = '';
            } catch (error) {
                alert(\`Error: \${error.message}\`);
            }
        });

        window.addEventListener('load', () => {
            const savedKey = localStorage.getItem('d1_api_key');
            if (savedKey) {
                document.getElementById('apiKey').value = savedKey;
                document.getElementById('loginForm').dispatchEvent(new Event('submit'));
            } else {
                initTheme();
            }
        });

        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                showView(view);

                if (view === 'tables') loadTables();
                else if (view === 'data') loadTableSelect();
                else if (view === 'query') loadQueryView();
            });
        });

        async function loadTables() {
            showLoading('tablesContent');

            try {
                const result = await apiRequest('/api/tables');

                if (!result.success) throw new Error(result.error);

                const tables = result.data;
                let html = '';

                if (tables.length === 0) {
                    html = '<div class="alert alert-info"><span>ℹ️</span><span>No tables found. Create your first table!</span></div>';
                } else {
                    html = '<div class="stats-grid">';
                    html += \`<div class="stat-card"><div class="stat-value">\${tables.length}</div><div class="stat-label">Total Tables</div></div>\`;
                    html += '</div>';

                    html += '<div class="card"><div class="card-body"><div class="table-responsive"><table><thead><tr><th>Table Name</th><th>Type</th><th>Actions</th></tr></thead><tbody>';

                    for (const table of tables) {
                        html += \`
                            <tr>
                                <td><strong>\${table.name}</strong></td>
                                <td>\${table.type}</td>
                                <td>
                                    <button class="btn btn-primary btn-sm" onclick="viewTableSchema('\${table.name}')">📋 Schema</button>
                                    <button class="btn btn-success btn-sm" onclick="browseTable('\${table.name}')">👁️ Browse</button>
                                    <button class="btn btn-danger btn-sm" onclick="deleteTable('\${table.name}')">🗑️ Delete</button>
                                </td>
                            </tr>
                        \`;
                    }

                    html += '</tbody></table></div></div></div>';
                }

                document.getElementById('tablesContent').innerHTML = html;
            } catch (error) {
                showError('tablesContent', error.message);
            }
        }

        async function viewTableSchema(tableName) {
            try {
                const result = await apiRequest(\`/api/tables/\${tableName}/schema\`);

                if (!result.success) throw new Error(result.error);

                let html = \`<div class="card"><div class="card-header">Schema: \${tableName}</div><div class="card-body"><div class="table-responsive"><table><thead><tr><th>Column</th><th>Type</th><th>Not Null</th><th>Primary Key</th><th>Default</th></tr></thead><tbody>\`;

                result.data.forEach(col => {
                    html += \`
                        <tr>
                            <td><strong>\${col.name}</strong></td>
                            <td>\${col.type}</td>
                            <td>\${col.notnull ? '✅' : '❌'}</td>
                            <td>\${col.pk ? '🔑' : ''}</td>
                            <td>\${col.dflt_value || '-'}</td>
                        </tr>
                    \`;
                });

                html += '</tbody></table></div></div></div>';

                document.getElementById('tablesContent').insertAdjacentHTML('beforeend', html);
            } catch (error) {
                alert(error.message);
            }
        }

        async function deleteTable(tableName) {
            if (!confirm(\`Are you sure you want to delete table "\${tableName}"?\`)) return;

            try {
                const result = await apiRequest(\`/api/tables/\${tableName}\`, { method: 'DELETE' });

                if (!result.success) throw new Error(result.error);

                alert('Table deleted successfully!');
                loadTables();
            } catch (error) {
                alert(error.message);
            }
        }

        document.getElementById('createTableBtn').addEventListener('click', () => {
            openModal('createTableModal');
        });

        document.getElementById('submitCreateTable').addEventListener('click', async () => {
            const sql = document.getElementById('createTableSQL').value;

            try {
                const result = await apiRequest('/api/tables', {
                    method: 'POST',
                    body: JSON.stringify({ sql }),
                });

                if (!result.success) throw new Error(result.error);

                closeModal('createTableModal');
                document.getElementById('createTableSQL').value = '';
                alert('Table created successfully!');
                loadTables();
            } catch (error) {
                alert(error.message);
            }
        });

        function browseTable(tableName) {
            showView('data');
            currentTable = tableName;
            document.getElementById('tableSelect').value = tableName;
            loadTableData();
        }

        async function loadTableSelect() {
            try {
                const result = await apiRequest('/api/tables');
                if (!result.success) throw new Error(result.error);

                const select = document.getElementById('tableSelect');
                select.innerHTML = '<option value="">Select a table...</option>';

                result.data.forEach(table => {
                    select.innerHTML += \`<option value="\${table.name}">\${table.name}</option>\`;
                });

                if (currentTable) {
                    select.value = currentTable;
                    loadTableData();
                }
            } catch (error) {
                showError('dataContent', error.message);
            }
        }

        document.getElementById('tableSelect').addEventListener('change', (e) => {
            currentTable = e.target.value;
            currentPage = 1;
            if (currentTable) loadTableData();
        });

        async function loadTableData(page = 1) {
            if (!currentTable) return;

            showLoading('dataContent');
            currentPage = page;

            try {
                const result = await apiRequest(\`/api/tables/\${currentTable}/rows?page=\${page}&limit=1000\`);

                if (!result.success) throw new Error(result.error);

                currentData = result.data || [];
                filteredData = [];
                sortColumn = null;
                sortDirection = 'asc';
                document.getElementById('dataSearch').value = '';

                renderTableData();
            } catch (error) {
                showError('dataContent', error.message);
            }
        }

        document.getElementById('addRowBtn').addEventListener('click', async () => {
            if (!currentTable) {
                alert('Please select a table first');
                return;
            }

            rowModalMode = 'add';
            editingRowId = null;
            document.getElementById('rowModalTitle').textContent = 'Add Row';

            try {
                const schemaResult = await apiRequest(\`/api/tables/\${currentTable}/schema\`);
                if (!schemaResult.success) throw new Error(schemaResult.error);

                // Store schema for use during submission
                currentTableSchema = schemaResult.data;

                let formHtml = '';
                schemaResult.data.forEach(col => {
                    // Skip auto-increment INTEGER primary keys (typically 'id')
                    if (col.pk && col.type.toUpperCase() === 'INTEGER' && col.name.toLowerCase() === 'id') return;

                    // Add placeholder for TEXT primary keys
                    const placeholder = col.pk && col.type.toUpperCase() === 'TEXT' ? 'placeholder="Leave empty to auto-generate UUID"' : '';

                    formHtml += \`
                        <div class="form-group">
                            <label>\${col.name} \${col.notnull && !col.pk ? '*' : ''}</label>
                            <input type="text" class="form-control" name="\${col.name}" \${col.notnull && !col.pk ? 'required' : ''} \${placeholder}>
                        </div>
                    \`;
                });

                document.getElementById('rowFormContent').innerHTML = formHtml;
                openModal('rowModal');
            } catch (error) {
                alert(error.message);
            }
        });

        async function editRow(row) {
            rowModalMode = 'edit';
            const columns = Object.keys(row);
            editingRowId = row[columns[0]];
            document.getElementById('rowModalTitle').textContent = 'Edit Row';

            try {
                const schemaResult = await apiRequest(\`/api/tables/\${currentTable}/schema\`);
                if (!schemaResult.success) throw new Error(schemaResult.error);

                // Store schema for consistency
                currentTableSchema = schemaResult.data;

                let formHtml = '';
                schemaResult.data.forEach(col => {
                    // Show all fields, but make primary keys readonly
                    const isReadonly = col.pk ? 'readonly' : '';
                    const pkLabel = col.pk ? ' 🔑' : '';
                    const style = col.pk ? 'style="background-color: var(--bg); cursor: not-allowed;"' : '';

                    formHtml += \`
                        <div class="form-group">
                            <label>\${col.name}\${pkLabel} \${col.notnull && !col.pk ? '*' : ''}</label>
                            <input type="text" class="form-control" name="\${col.name}" value="\${row[col.name] || ''}" \${col.notnull && !col.pk ? 'required' : ''} \${isReadonly} \${style}>
                        </div>
                    \`;
                });

                document.getElementById('rowFormContent').innerHTML = formHtml;
                openModal('rowModal');
            } catch (error) {
                alert(error.message);
            }
        }

        document.getElementById('submitRow').addEventListener('click', async () => {
            const formData = {};
            document.querySelectorAll('#rowFormContent input').forEach(input => {
                formData[input.name] = input.value || null;
            });

            try {
                let result;
                if (rowModalMode === 'add') {
                    // Auto-generate UUID for empty TEXT primary keys
                    currentTableSchema.forEach(col => {
                        if (col.pk && col.type.toUpperCase() === 'TEXT') {
                            if (!formData[col.name] || formData[col.name] === null || formData[col.name].trim() === '') {
                                formData[col.name] = generateUUID();
                                console.log(\`Auto-generated UUID for \${col.name}: \${formData[col.name]}\`);
                            }
                        }
                    });

                    result = await apiRequest(\`/api/tables/\${currentTable}/rows\`, {
                        method: 'POST',
                        body: JSON.stringify(formData),
                    });
                } else {
                    result = await apiRequest(\`/api/tables/\${currentTable}/rows/\${editingRowId}\`, {
                        method: 'PUT',
                        body: JSON.stringify(formData),
                    });
                }

                if (!result.success) throw new Error(result.error);

                closeModal('rowModal');
                alert(rowModalMode === 'add' ? 'Row added successfully!' : 'Row updated successfully!');
                loadTableData(currentPage);
            } catch (error) {
                alert(error.message);
            }
        });

        async function deleteRow(id) {
            if (!confirm('Are you sure you want to delete this row?')) return;

            try {
                const result = await apiRequest(\`/api/tables/\${currentTable}/rows/\${id}\`, {
                    method: 'DELETE',
                });

                if (!result.success) throw new Error(result.error);

                alert('Row deleted successfully!');
                loadTableData(currentPage);
            } catch (error) {
                alert(error.message);
            }
        }

        function loadQueryView() {
            document.getElementById('queryResults').innerHTML = '';
        }

        document.getElementById('executeQueryBtn').addEventListener('click', async () => {
            const sql = document.getElementById('sqlEditor').value.trim();

            if (!sql) {
                alert('Please enter a SQL query');
                return;
            }

            showLoading('queryResults');

            try {
                const result = await apiRequest('/api/query', {
                    method: 'POST',
                    body: JSON.stringify({ sql }),
                });

                if (!result.success) throw new Error(result.error);

                let html = '<div class="card"><div class="card-header">Query Results</div><div class="card-body">';

                if (result.data.results && result.data.results.length > 0) {
                    currentData = result.data.results;
                    const columns = Object.keys(result.data.results[0]);
                    html += '<div class="table-responsive"><table><thead><tr>';

                    columns.forEach(col => {
                        html += \`<th>\${col}</th>\`;
                    });
                    html += '</tr></thead><tbody>';

                    result.data.results.forEach(row => {
                        html += '<tr>';
                        columns.forEach(col => {
                            const value = row[col] === null ? '<em>NULL</em>' : row[col];
                            html += \`<td>\${value}</td>\`;
                        });
                        html += '</tr>';
                    });

                    html += '</tbody></table></div>';
                    html += \`<p style="margin-top: 15px; color: var(--text-light);">Returned \${result.data.results.length} rows</p>\`;
                } else {
                    html += '<div class="alert alert-success"><span>✅</span><span>Query executed successfully!</span></div>';
                }

                html += '</div></div>';

                document.getElementById('queryResults').innerHTML = html;
            } catch (error) {
                showError('queryResults', error.message);
            }
        });

        document.getElementById('exportQueryBtn').addEventListener('click', () => {
            if (!currentData || currentData.length === 0) {
                alert('No query results to export');
                return;
            }
            openModal('exportModal');
        });
    </script>
</body>
</html>`;
}

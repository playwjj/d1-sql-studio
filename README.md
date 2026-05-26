# D1 SQL Studio

A professional database management tool for Cloudflare D1, built with **Vue 3 + Naive UI + TypeScript + Vite**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020)
![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)

## ✨ Features

- 🎨 **Professional UI** - Built with Vue 3 + Naive UI for a tooling-grade experience
- 📊 **Table Management** - Create, view, and delete tables with a visual builder and SQL editor
- 📝 **Data Browser** - Browse and manage table data with pagination, sorting, and search
- ⚡ **SQL Query Editor** - Execute custom SQL with CodeMirror 6, syntax highlighting, and autocompletion
- 🗂️ **Query History** - Persistent query history with search and filter
- 🔐 **Secure Authentication** - Multi-user API key management with KV storage
- 🎯 **Visual Table Builder** - Build table schemas with a GUI — real-time SQL preview
- 🔑 **API Key Management** - Generate, manage, and revoke API keys through the UI
- 🛡️ **Security Hardened** - SQL injection protection and identifier validation
- 🌐 **Edge Computing** - Runs on Cloudflare Workers for global performance
- 🔌 **REST API** - Complete REST API for programmatic access
- 🔀 **Multi-Field Sorting** - Sort data by multiple columns simultaneously
- 🔗 **Multi-Table Joins** - Structured JOIN queries with RESTful API

## 🏗️ Architecture

### Backend (Cloudflare Worker)
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite-based)
- **API Keys Storage**: Cloudflare KV
- **Static Assets**: Workers Assets
- **Location**: `src/worker/`

### Frontend (Vue 3 SPA)
- **Framework**: Vue 3 + Composition API
- **UI Library**: Naive UI
- **State Management**: Pinia
- **Routing**: Vue Router
- **Editor**: CodeMirror 6
- **Language**: TypeScript
- **Bundler**: Vite
- **Location**: `src/ui/`

```
┌─────────────────┐
│   Cloudflare    │
│   Workers Edge  │
├─────────────────┤
│  Static Assets  │ ← Vite build output
│  (index.html)   │
├─────────────────┤
│   API Routes    │ ← REST API (/api/*)
│   (/api/*)      │
├─────────────────┤
│   D1 Database   │ ← SQLite (Data)
├─────────────────┤
│   KV Storage    │ ← API Keys
└─────────────────┘
```

## 📦 Installation

```bash
npm install
```

## 🛠️ Development

### Local Development

Start the frontend development server (with HMR):
```bash
npm run dev
```
Access at `http://localhost:5173`

Start the Worker development server (in a separate terminal):
```bash
npm run dev:worker
```
Worker runs at `http://localhost:8787`

The frontend proxies `/api/*` requests to the Worker automatically.

### Database Setup

**Option 1: Configure in wrangler.toml (Local Development)**

1. Create D1 database:
```bash
npx wrangler d1 create d1-sql-studio-db
```

2. Copy the `database_id` from the output and update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "d1-sql-studio-db"
database_id = "your-database-id-here"
```

3. Restart the dev server

**Option 2: Cloudflare Dashboard (Production, Recommended)**

1. Deploy your Worker
2. Go to Cloudflare Dashboard → Workers & Pages → Your Worker → Settings → Bindings
3. Add D1 binding: Variable name = `DB`, select/create your database
4. Save and wait a few seconds

### API Keys Setup

API keys are managed through the UI and stored in Cloudflare KV.

**First-time setup:**
1. Deploy the app (see below)
2. Visit your app URL — you'll see the first-time setup screen
3. Create your first API key
4. **Save the generated key** — it's only shown once
5. Log in with your new key

## 🏗️ Build

```bash
# Build frontend only
npm run build:ui

# Type-check worker
npm run build:worker

# Full build (frontend + type check)
npm run build
```

## 🚀 Deployment

### Prerequisites

#### 1. Create D1 Database

```bash
npx wrangler d1 create d1-sql-studio
```

Copy the `database_id` and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "d1-sql-studio"
database_id = "your-database-id-here"
```

#### 2. Create KV Namespace for API Keys

```bash
npx wrangler kv:namespace create "API_KEYS"
```

Copy the `id` and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "API_KEYS"
id = "your-kv-id-here"
```

### Deploy

```bash
npm run deploy
```

This builds the frontend and deploys to Cloudflare Workers.

### First-Time Setup

1. Visit your Worker URL
2. See the **First-Time Setup** screen
3. Enter a name for your first API key and click **Generate API Key**
4. Copy and save the key securely — it won't be shown again
5. Click **Continue to Dashboard**

## 📁 Project Structure

```
d1-sql-studio/
├── src/
│   ├── worker/                  # Backend (Cloudflare Worker)
│   │   ├── index.ts            # Worker entry point
│   │   ├── router.ts           # API routing
│   │   ├── db.ts               # D1 database operations
│   │   ├── auth.ts             # Authentication
│   │   ├── apikeys.ts          # API key management (KV)
│   │   ├── security.ts         # Security validation
│   │   └── types.ts            # TypeScript types
│   └── ui/                      # Frontend (Vue 3 SPA)
│       ├── main.ts             # App entry point
│       ├── App.vue             # Root component (Naive UI providers)
│       ├── env.d.ts            # Vue module declarations
│       ├── router/
│       │   └── index.ts        # Vue Router + navigation guards
│       ├── stores/
│       │   ├── auth.ts         # Auth state (apiKey, login/logout)
│       │   ├── tables.ts       # Table list + selected table
│       │   └── notification.ts # showToast / showConfirm
│       ├── composables/
│       │   ├── useTableSchema.ts  # Schema loading with 5-min cache
│       │   └── useExport.ts       # CSV / JSON / SQL export
│       ├── layouts/
│       │   └── DashboardLayout.vue  # Sidebar + main content layout
│       ├── views/
│       │   ├── auth/
│       │   │   ├── LoginView.vue
│       │   │   └── FirstTimeSetupView.vue
│       │   ├── tables/TablesView.vue
│       │   ├── data/DataBrowserView.vue
│       │   ├── query/QueryEditorView.vue
│       │   └── keys/ApiKeysView.vue
│       ├── components/
│       │   ├── tables/
│       │   │   ├── CreateTableModal.vue
│       │   │   ├── VisualTableBuilder.vue  # GUI builder + SQL preview
│       │   │   └── EditTableModal.vue       # Columns / Rename / Indexes tabs
│       │   ├── data-browser/
│       │   │   ├── AddRowModal.vue
│       │   │   ├── EditRowModal.vue
│       │   │   └── ApiDocumentation.vue     # Collapsible REST API reference
│       │   ├── query-editor/
│       │   │   ├── SqlEditor.vue            # CodeMirror 6 wrapper
│       │   │   ├── ResultsTable.vue
│       │   │   ├── QueryHistory.vue
│       │   │   └── KeyboardShortcuts.vue
│       │   └── shared/
│       │       └── NullValue.vue
│       └── lib/                 # Pure TypeScript utilities (no framework deps)
│           ├── api.ts          # ApiClient class
│           ├── exportUtils.ts  # CSV / JSON / SQL export
│           ├── queryHistory.ts # localStorage query history
│           └── utils.ts
├── public/                      # Static assets
├── dist/                        # Build output
├── index.html                  # HTML template
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript config (UI)
├── tsconfig.worker.json        # TypeScript config (Worker)
├── wrangler.toml               # Cloudflare Workers config
└── package.json
```

## 🔧 API Usage

All API endpoints require the `Authorization` header:

```bash
Authorization: Bearer your-api-key
```

### List Tables
```bash
GET /api/tables
```

### Get Table Schema
```bash
GET /api/tables/:tableName/schema
```

### Get Table Data
```bash
GET /api/tables/:tableName/rows?page=1&limit=50&sortBy=id&sortOrder=asc&search=keyword
```

**Query Parameters:**
- `page` — Page number (default: 1)
- `limit` — Rows per page (default: 50, max: 1000)
- `sortBy` — Column to sort by (single field)
- `sortOrder` — `asc` or `desc` (default: asc)
- `sort` — Multi-field sort, format: `field1:order1,field2:order2`
- `search` — Keyword search across all TEXT columns

**Multi-field sort examples:**
```bash
# Sort by name ascending, then created_at descending
GET /api/tables/users/rows?sort=name:asc,created_at:desc
```

### Execute SQL Query
```bash
POST /api/query
Content-Type: application/json

{
  "sql": "SELECT * FROM users WHERE created_at > ? LIMIT ?",
  "params": ["2024-01-01", 10]
}
```

**Allowed statements:** `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `PRAGMA`

**Security:** parameterized queries, multiple statements blocked, DDL not allowed via this endpoint.

### Multi-Table Join Query

```bash
POST /api/join
Content-Type: application/json

{
  "baseTable": "users",
  "joins": [
    { "table": "orders", "type": "LEFT", "on": "users.id = orders.user_id" }
  ],
  "select": ["users.*", "COUNT(orders.id) as order_count"],
  "where": "users.created_at > ?",
  "groupBy": ["users.id"],
  "orderBy": "order_count DESC",
  "limit": 20,
  "params": ["2024-01-01"]
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `baseTable` | string | ✅ | Base table name |
| `joins` | JoinConfig[] | ✅ | JOIN configurations (1–10 joins) |
| `select` | string[] | ❌ | Columns to select (default: `["*"]`) |
| `where` | string | ❌ | WHERE clause with `?` placeholders |
| `groupBy` | string[] | ❌ | GROUP BY columns |
| `having` | string | ❌ | HAVING clause |
| `orderBy` | string | ❌ | ORDER BY clause |
| `limit` | number | ❌ | Max records (max: 1000) |
| `offset` | number | ❌ | Pagination offset |
| `params` | any[] | ❌ | Values for WHERE/HAVING |

### Table CRUD

```bash
POST   /api/tables                      # Create table (body: { sql })
DELETE /api/tables/:tableName           # Drop table
POST   /api/tables/:tableName/rows      # Insert row
PUT    /api/tables/:tableName/rows/:id  # Update row
DELETE /api/tables/:tableName/rows/:id  # Delete row
```

### Column Management

```bash
POST   /api/tables/:tableName/columns/:columnName   # Add column
PUT    /api/tables/:tableName/columns/:columnName   # Rename column
DELETE /api/tables/:tableName/columns/:columnName   # Drop column
PUT    /api/tables/:tableName/rename                # Rename table
```

### Index Management

```bash
GET    /api/tables/:tableName/indexes                     # List indexes
GET    /api/tables/:tableName/indexes/:indexName/columns  # Index columns
POST   /api/tables/:tableName/indexes                     # Create index
DELETE /api/tables/:tableName/indexes/:indexName          # Drop index
```

### API Key Management

```bash
GET    /api/keys          # List keys
POST   /api/keys          # Create key (body: { name, description? })
DELETE /api/keys/:id      # Delete key
GET    /api/keys/status   # Check if any keys exist (unauthenticated)
```

## 📝 Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server (port 5173) |
| `npm run dev:worker` | Start Worker dev server (port 8787) |
| `npm run build` | Full build (UI + type check) |
| `npm run build:ui` | Build frontend only |
| `npm run build:worker` | Type-check Worker |
| `npm run preview` | Preview production build |
| `npm run deploy` | Build UI + deploy to Cloudflare |

## 🎯 Tech Stack

**Frontend:**
- 🟢 Vue 3 — Composition API
- 🎨 Naive UI — Professional component library
- 🍍 Pinia — State management
- 🔀 Vue Router — Client-side routing
- 📝 CodeMirror 6 — SQL editor with syntax highlighting
- 📘 TypeScript 5
- ⚡ Vite 5

**Backend:**
- ☁️ Cloudflare Workers — Edge computing
- 🗄️ Cloudflare D1 — SQLite database
- 📦 Workers Assets — Static asset serving

**Tools:**
- 🔨 Wrangler — Cloudflare CLI
- 📦 npm

## 🔒 Security Features

- **API Key Management** — Multi-user support, bcrypt-hashed storage in KV
- **SQL Injection Protection** — Identifier validation with strict regex
- **Query Whitelisting** — Only SELECT/INSERT/UPDATE/DELETE/PRAGMA via `/api/query`
- **Identifier Quoting** — All SQL identifiers automatically quoted
- **Same-Origin CORS** — API restricted to same-origin requests by default
- **Session Persistence** — Auto-login from localStorage, cleared on logout

## 🐛 Troubleshooting

### "DATABASE_NOT_BOUND" Error

1. Create D1 database: `npx wrangler d1 create d1-sql-studio`
2. Update `database_id` in `wrangler.toml`
3. Redeploy: `npm run deploy`

### First-Time Setup Screen Not Appearing

1. Create KV namespace: `npx wrangler kv:namespace create "API_KEYS"`
2. Update `wrangler.toml` with namespace ID
3. Redeploy and clear browser cache

### Build Errors

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### TypeScript Errors

```bash
tsc --noEmit                           # Frontend
tsc --project tsconfig.worker.json    # Worker
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Built for [Cloudflare Workers](https://workers.cloudflare.com/)
- Powered by [Cloudflare D1](https://developers.cloudflare.com/d1/)
- UI with [Vue 3](https://vuejs.org/) + [Naive UI](https://www.naiveui.com/)
- Editor by [CodeMirror](https://codemirror.net/)
- Bundled by [Vite](https://vitejs.dev/)

---

**Star ⭐ this repo if you find it useful!**

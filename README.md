# D1 SQL Studio

A modern, lightweight database management tool for Cloudflare D1, built with **Preact + TypeScript + Vite**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)

## ✨ Features

- 🎨 **Modern Web Interface** - Built with Preact for optimal performance
- 📊 **Table Management** - Create, view, and delete database tables with visual builder
- 📝 **Data Browser** - Browse and manage table data with pagination
- ⚡ **SQL Query Editor** - Execute custom SQL queries with Ctrl+Enter shortcut
- 🔐 **Secure Authentication** - Multi-user API key management with KV storage
- 🎯 **Visual Table Builder** - Create tables with an intuitive drag-and-drop interface
- 🔑 **API Key Management** - Generate, manage, and revoke API keys through the UI
- ✅ **Form Validation** - Real-time validation with helpful error messages
- 🛡️ **Security Hardened** - SQL injection protection and input validation
- 🌐 **Edge Computing** - Runs on Cloudflare Workers for global performance
- 📦 **Lightweight** - Only ~10KB gzipped bundle size
- 🔌 **REST API** - Complete REST API for programmatic access

## 🏗️ Architecture

This project uses a modern, component-based architecture:

### Backend (Cloudflare Worker)
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite-based)
- **API Keys Storage**: Cloudflare KV
- **Static Assets**: Workers Sites (KV-based)
- **Location**: `src/worker/`

### Frontend (Preact SPA)
- **Framework**: Preact (~3KB React alternative)
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
# Install dependencies
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

The frontend proxies `/api/*` requests to the Worker.

### Database Setup

**Option 1: Configure in wrangler.toml (Local Development)**

1. Create D1 database:
```bash
npx wrangler d1 create d1-sql-studio-db
```

2. Copy the `database_id` from the output

3. Edit `wrangler.toml` and uncomment the `[[d1_databases]]` section:
```toml
[[d1_databases]]
binding = "DB"
database_name = "d1-sql-studio-db"
database_id = "your-database-id-here"
```

4. Restart the dev server

**Option 2: Cloudflare Dashboard (Production, Recommended)**

1. Deploy your Worker
2. Go to Cloudflare Dashboard
3. Navigate to Workers & Pages > Your Worker
4. Go to Settings > Bindings > D1 Database Bindings
5. Add binding: Variable name = `DB`, select/create your database
6. Save and wait a few seconds for the configuration to take effect

### API Keys Setup

**Important:** API keys are now managed through the UI, not environment variables.

The app uses Cloudflare KV to store API keys, allowing you to:
- Create multiple API keys with descriptions
- Manage and revoke keys through the dashboard
- Track when keys were last used
- No need to redeploy when rotating keys

**First-time setup:**
1. Deploy the app (see deployment section below)
2. Visit your app URL - you'll see a first-time setup screen
3. Create your first API key through the UI
4. Save the generated key securely
5. Login with your new API key

**Note:** For local development, a fallback default key is used if no KV is configured.

## 🏗️ Build

```bash
# Build frontend only
npm run build:ui

# Type-check worker only
npm run build:worker

# Full build (frontend + type check)
npm run build
```

Build output:
- Frontend: `dist/` directory
- Bundle size: ~28KB (~10KB gzipped)

## 🚀 Deployment

### Prerequisites

Before deploying, you need to create two Cloudflare resources:

#### 1. Create D1 Database

```bash
npx wrangler d1 create d1-sql-studio
```

Copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "d1-sql-studio"
database_id = "your-database-id-here"  # Replace with your database ID
```

#### 2. Create KV Namespace for API Keys

```bash
npx wrangler kv:namespace create "API_KEYS"
```

Copy the `id` from the output and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "API_KEYS"
id = "your-kv-id-here"  # Replace with your KV namespace ID
```

For preview environment (optional):
```bash
npx wrangler kv:namespace create "API_KEYS" --preview
```

### Deploy to Cloudflare Workers

```bash
npm run deploy
```

This will:
1. Build the frontend (Vite)
2. Type-check the worker (TypeScript)
3. Deploy to Cloudflare Workers

### First-Time Setup

After deployment:

1. Visit your Worker URL (e.g., `https://d1-sql-studio.your-subdomain.workers.dev`)
2. You'll see a **First-Time Setup** screen
3. Enter a name for your first API key (e.g., "Production Key")
4. Click **Generate API Key**
5. **Important:** Copy and save the generated key securely - you won't see it again!
6. Click **Continue to Dashboard**
7. You're now logged in and can start managing your database

### Managing API Keys

After initial setup, you can manage API keys from the Dashboard:

- **Settings > API Keys** - View all your API keys
- **Create New Key** - Generate additional API keys for different users/apps
- **Delete** - Revoke API keys instantly (no redeployment needed)
- **Track Usage** - See when each key was last used

### Alternative: Cloudflare Dashboard Setup

If you prefer using the Cloudflare Dashboard:

1. Go to **Workers & Pages** > Select your worker
2. **Settings** > **Bindings**
3. Add **D1 Database Binding**:
   - Variable name: `DB`
   - Select your D1 database
4. Add **KV Namespace Binding**:
   - Variable name: `API_KEYS`
   - Select your KV namespace
5. Save and redeploy

## 📁 Project Structure

```
d1-sql-studio/
├── src/
│   ├── worker/              # Backend (Cloudflare Worker)
│   │   ├── index.ts        # Worker entry point
│   │   ├── router.ts       # API routing
│   │   ├── db.ts           # D1 database operations
│   │   ├── auth.ts         # Authentication
│   │   ├── apikeys.ts      # API key management (KV)
│   │   ├── security.ts     # Security validation
│   │   └── types.ts        # TypeScript types
│   └── ui/                  # Frontend (Preact SPA)
│       ├── components/     # React components
│       │   ├── shared/     # Shared components
│       │   │   ├── Modal.tsx
│       │   │   ├── Button.tsx
│       │   │   ├── Alert.tsx
│       │   │   ├── FormField.tsx
│       │   │   ├── Toast.tsx
│       │   │   └── ConfirmDialog.tsx
│       │   ├── Tables/     # Tables view
│       │   │   ├── TableList.tsx
│       │   │   ├── CreateTableModal.tsx
│       │   │   └── VisualTableBuilder.tsx
│       │   ├── DataBrowser/ # Data browser
│       │   │   ├── DataBrowser.tsx
│       │   │   ├── AddRowModal.tsx
│       │   │   └── EditRowModal.tsx
│       │   ├── QueryEditor/ # SQL query editor
│       │   ├── Login.tsx   # Login component
│       │   ├── FirstTimeSetup.tsx # Initial setup
│       │   ├── ApiKeyManagement.tsx # API key management
│       │   └── Dashboard.tsx # Main dashboard
│       ├── contexts/        # React contexts
│       │   └── NotificationContext.tsx
│       ├── hooks/           # Custom hooks
│       │   └── useFormValidation.ts
│       ├── lib/            # Utilities
│       │   ├── api.ts      # API client
│       │   └── utils.ts    # Helper functions
│       ├── App.tsx         # Root component
│       ├── main.tsx        # Entry point
│       └── styles.css      # Global styles
├── public/                  # Static assets
├── dist/                    # Build output
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config (UI)
├── tsconfig.worker.json    # TypeScript config (Worker)
├── wrangler.toml           # Cloudflare Workers config
└── package.json            # Dependencies & scripts
```

## 🔧 API Usage

All API endpoints require authentication via the `Authorization` header:

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
- `page` (optional): Page number (default: 1)
- `limit` (optional): Rows per page (default: 50)
- `sortBy` (optional): Column name to sort by
- `sortOrder` (optional): Sort direction - `asc` or `desc` (default: asc)
- `search` (optional): Search keyword (searches in all TEXT columns)

**Examples:**
```bash
# Basic pagination
GET /api/tables/users/rows?page=1&limit=50

# Sort by ID descending
GET /api/tables/users/rows?sortBy=id&sortOrder=desc

# Sort by name ascending
GET /api/tables/users/rows?sortBy=name&sortOrder=asc

# Search for "john" and sort by created_at
GET /api/tables/users/rows?search=john&sortBy=created_at&sortOrder=desc
```

### Execute SQL Query
```bash
POST /api/query
Content-Type: application/json

{
  "sql": "SELECT * FROM users LIMIT 10",
  "params": []
}
```

### Create Table
```bash
POST /api/tables
Content-Type: application/json

{
  "sql": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)"
}
```

### Delete Table
```bash
DELETE /api/tables/:tableName
```

### Insert Row
```bash
POST /api/tables/:tableName/rows
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Update Row
```bash
PUT /api/tables/:tableName/rows/:id
Content-Type: application/json

{
  "name": "Jane Doe"
}
```

### Delete Row
```bash
DELETE /api/tables/:tableName/rows/:id
```

### API Key Management

#### List API Keys
```bash
GET /api/keys
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "name": "Production Key",
      "description": "Main production API key",
      "createdAt": "2024-01-15T10:30:00Z",
      "lastUsedAt": "2024-01-20T15:45:00Z"
    }
  ]
}
```

#### Create API Key
```bash
POST /api/keys
Content-Type: application/json

{
  "name": "New Key",
  "description": "Optional description"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "name": "New Key",
    "key": "generated-api-key-here",
    "createdAt": "2024-01-20T16:00:00Z"
  }
}
```

#### Delete API Key
```bash
DELETE /api/keys/:keyName
```

## 📝 Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run dev:worker` | Start Worker dev server |
| `npm run build` | Full build (UI + type check) |
| `npm run build:ui` | Build frontend only |
| `npm run build:worker` | Type-check Worker |
| `npm run preview` | Preview production build |
| `npm run deploy` | Deploy to Cloudflare |

## 🎯 Tech Stack

**Frontend:**
- ⚛️ Preact 10 - Lightweight React alternative (~3KB)
- 📘 TypeScript 5 - Type safety
- ⚡ Vite 5 - Fast bundler with HMR
- 🎨 CSS Variables - Themeable design system

**Backend:**
- ☁️ Cloudflare Workers - Edge computing
- 🗄️ Cloudflare D1 - SQLite database
- 📦 Workers Sites - Static asset serving

**Tools:**
- 🔨 Wrangler - Cloudflare CLI
- 📦 npm - Package manager

## 🔒 Security Features

### Authentication & Authorization
- **API Key Management**: Multi-user support with individual API keys
- **Secure Storage**: API keys stored in Cloudflare KV with bcrypt hashing
- **Session Persistence**: Auto-login with locally stored keys
- **Key Rotation**: Revoke and regenerate keys without redeployment

### Input Validation & Security
- **SQL Injection Protection**: All table/column names validated with strict regex patterns
- **Query Whitelisting**: Only SELECT, INSERT, UPDATE, DELETE, and PRAGMA statements allowed
- **Identifier Quoting**: All SQL identifiers properly quoted to prevent injection
- **Input Sanitization**: Comprehensive validation on all user inputs
- **Type Checking**: Strong type validation for all data operations

### CORS Policy
- **Same-Origin Only**: CORS restricted to same-origin requests by default
- The frontend and API must be served from the same domain
- Modify `src/worker/auth.ts` if you need custom CORS rules

### Best Practices
1. **API Keys**:
   - Generate strong, unique keys for each user/application
   - Add descriptions to track key usage
   - Regularly review and revoke unused keys
   - Never share API keys publicly or commit them to version control

2. **Database Security**:
   - Query editor blocks dangerous operations (DROP, CREATE, ALTER, TRUNCATE)
   - Use the Visual Table Builder for schema changes
   - All identifiers are validated against SQL keywords

3. **KV Namespace**:
   - Keep your KV namespace ID private
   - Use separate namespaces for development and production

## 🐛 Troubleshooting

### "DATABASE_NOT_BOUND" Error

The app will show a setup guide if no database is bound. Follow these steps:

1. Create a D1 database: `npx wrangler d1 create d1-sql-studio`
2. Copy the database ID and update `wrangler.toml`
3. Redeploy: `npm run deploy`
4. Or bind via Cloudflare Dashboard: Settings > Bindings > D1 Database Bindings
5. Refresh the page

### "First-Time Setup" Screen Not Appearing

If you deployed without a KV namespace, the app will use a fallback authentication mode:

1. Create KV namespace: `npx wrangler kv:namespace create "API_KEYS"`
2. Update `wrangler.toml` with the namespace ID
3. Redeploy: `npm run deploy`
4. Clear your browser cache and revisit the app

### Can't Login After Creating API Key

If you created an API key but can't login:

1. Make sure you copied the full API key (it's only shown once)
2. Check browser console for errors
3. Verify KV namespace is properly bound in Cloudflare Dashboard
4. Try creating a new API key from the First-Time Setup screen

### API Keys Not Persisting

If your API keys disappear after deployment:

1. Verify KV namespace binding in `wrangler.toml`
2. Check that the binding name is exactly `API_KEYS`
3. Ensure you're not using `--preview` mode in production
4. Check Cloudflare Dashboard > KV to verify data is stored

### Build Errors

If you encounter build errors:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### TypeScript Errors

Make sure you're using the correct TypeScript configuration:

- Frontend: `tsconfig.json`
- Worker: `tsconfig.worker.json`

Run type checking separately:
```bash
tsc --noEmit  # Frontend
tsc --project tsconfig.worker.json  # Worker
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for [Cloudflare Workers](https://workers.cloudflare.com/)
- Powered by [Cloudflare D1](https://developers.cloudflare.com/d1/)
- UI with [Preact](https://preactjs.com/)
- Bundled by [Vite](https://vitejs.dev/)

---

**Star ⭐ this repo if you find it useful!**

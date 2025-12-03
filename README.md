# D1 SQL Studio

A modern, lightweight database management tool for Cloudflare D1, built with **Preact + TypeScript + Vite**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)

## ✨ Features

- 🎨 **Modern Web Interface** - Built with Preact for optimal performance
- 📊 **Table Management** - Create, view, and delete database tables
- 📝 **Data Browser** - Browse and manage table data with pagination
- ⚡ **SQL Query Editor** - Execute custom SQL queries with Ctrl+Enter shortcut
- 🔐 **Secure Authentication** - API key-based auth with session persistence
- 🌐 **Edge Computing** - Runs on Cloudflare Workers for global performance
- 📦 **Lightweight** - Only ~10KB gzipped bundle size
- 🔌 **REST API** - Complete REST API for programmatic access

## 🏗️ Architecture

This project uses a modern, component-based architecture:

### Backend (Cloudflare Worker)
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite-based)
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
│   D1 Database   │ ← SQLite
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

### Environment Variables

**API Key** (Optional, defaults to `dev-api-key-change-in-production`):

Set in Cloudflare Dashboard:
- Settings > Variables and Secrets
- Add variable: `API_KEY` = your-secret-key

Or in `wrangler.toml` for local development:
```toml
[vars]
API_KEY = "your-api-key"
```

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

### Quick Setup (One-Time Configuration)

**Step 1:** Set your API_KEY in `wrangler.toml`:
```toml
[vars]
API_KEY = "your-production-api-key"
```

Generate a strong key: `openssl rand -base64 32`

**Step 2:** Ensure database binding is configured (already done):
```toml
[[d1_databases]]
binding = "DB"
database_name = "d1-sql-studio"
database_id = "your-database-id"
```

**Step 3:** Commit and push (for Cloudflare Pages) or deploy locally:

```bash
# For Cloudflare Pages (GitHub integration)
git add wrangler.toml
git commit -m "Configure deployment"
git push

# For local deployment
npm run deploy
```

**Done!** 🎉 All future deployments will automatically use these settings. No need to reconfigure in Cloudflare Dashboard.

### Access Your App
- Visit your Worker URL (e.g., `https://d1-sql-studio.your-subdomain.workers.dev`)
- Login with your API key

## 📁 Project Structure

```
d1-sql-studio/
├── src/
│   ├── worker/              # Backend (Cloudflare Worker)
│   │   ├── index.ts        # Worker entry point
│   │   ├── router.ts       # API routing
│   │   ├── db.ts           # D1 database operations
│   │   ├── auth.ts         # Authentication
│   │   └── types.ts        # TypeScript types
│   └── ui/                  # Frontend (Preact SPA)
│       ├── components/     # React components
│       │   ├── shared/     # Shared components (Modal, Button, Alert)
│       │   ├── Tables/     # Tables view
│       │   ├── DataBrowser/ # Data browser
│       │   ├── QueryEditor/ # SQL query editor
│       │   ├── Login.tsx   # Login component
│       │   └── Dashboard.tsx # Main dashboard
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
GET /api/tables/:tableName/rows?page=1&limit=50
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

## 🔒 Security Notes

1. **Change the default API key in production!**
   - Default key: `dev-api-key-change-in-production`
   - Set via Cloudflare Dashboard or `wrangler.toml`

2. **Database binding**
   - Ensure your D1 database is properly bound to the Worker
   - Check the binding variable name is exactly `DB`

3. **CORS**
   - CORS is enabled by default for API routes
   - Modify `src/worker/auth.ts` to restrict origins if needed

## 🐛 Troubleshooting

### "DATABASE_NOT_BOUND" Error

The app will show a setup guide if no database is bound. Follow these steps:

1. Create a D1 database (if not already created)
2. Bind it to your Worker with variable name `DB`
3. For Cloudflare Dashboard: Settings > Bindings > D1 Database Bindings
4. For local dev: Configure in `wrangler.toml`
5. Refresh the page

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

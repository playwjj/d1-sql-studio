# D1 SQL Studio

A modern database management tool for Cloudflare D1, featuring a **beautiful Web UI** (similar to phpMyAdmin) and a complete **REST API** for database operations.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)

## ✨ Features

### 🎨 Web Management Interface
- **Secure Login** - API Key authentication with session persistence
- **Visual Table Builder** - Create tables with intuitive UI, no SQL knowledge required
  - Support for 10 field types: INTEGER, TEXT, REAL, BLOB, UUID, DATETIME, DATE, TIME, BOOLEAN, JSON
  - Primary key configuration (single field, composite, or none)
  - Auto-increment support for INTEGER primary keys
  - Field constraints (NOT NULL, UNIQUE, DEFAULT values)
  - Real-time SQL preview
- **Field Manager** - Add fields to existing tables using ALTER TABLE
  - View current table structure
  - Add new fields with full constraint support
  - Visual field display with badges
- **Table Management** - View, create, delete tables and inspect schemas
- **Data Browser** - Browse, add, edit, and delete records with pagination
- **Advanced Search & Filter** - Real-time search across all data fields
- **Column Sorting** - Click column headers to sort data ascending/descending
- **Data Export** - Export table data or query results to CSV or JSON
- **SQL Query Editor** - Execute custom SQL queries with result visualization
- **Keyboard Shortcuts** - Ctrl+Enter to execute queries, Esc to close modals
- **Dark Mode** - Toggle between light and dark themes with persistent preference
- **Responsive Design** - Works on desktop and mobile devices
- **No Dependencies** - Pure JavaScript, no build required

### 🔌 REST API
- **Database Management** - List tables, view schemas, create/drop tables
- **Custom SQL Execution** - Run any SQL query with parameter binding
- **Full CRUD Operations** - Create, read, update, delete records
- **Pagination Support** - Handle large datasets efficiently
- **CORS Enabled** - Cross-origin resource sharing supported
- **Bearer Token Auth** - Secure API access

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- Cloudflare account

### ⚡ Zero-Config Installation (Development)

Get started in **3 simple steps** with minimal configuration:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create D1 database and configure**
   ```bash
   npx wrangler d1 create d1-sql-studio-db
   ```

   Copy the `database_id` from the output and paste it into `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "d1-sql-studio-db"
   database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Paste your ID here
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Your app will be available at **http://localhost:8787**

   **Default API Key**: `dev-api-key-change-in-production`

That's it! No additional configuration needed for development.

### 🚀 Production Deployment

#### Option 1: GitHub Auto-Deploy (Recommended, Zero Config)

Deploy automatically via Cloudflare Dashboard connected to GitHub:

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/d1-sql-studio.git
   git push -u origin main
   ```

2. **Create project in Cloudflare Dashboard**
   - Visit [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Go to **Workers & Pages** → Click **Create Application**
   - Select **Pages** tab → **Connect to Git**
   - Authorize and select your GitHub repository

3. **Configure build settings**
   - **Framework preset**: None
   - **Build command**: `npm run build` (runs TypeScript type checking)
   - **Build output directory**: `/` (leave as default)
   - **Root directory**: `/` (leave as default)

4. **Create and bind D1 database**

   Before deployment, create D1 database:
   ```bash
   # Create database locally
   npx wrangler d1 create d1-sql-studio-db
   ```

   Copy the `database_id` from output, then in Cloudflare Dashboard:
   - Go to your Pages project → **Settings** → **Functions**
   - Scroll to **D1 database bindings**
   - Click **Add binding**
   - Variable name: `DB`
   - D1 database: Select `d1-sql-studio-db` (or create new database)
   - Click **Save**

5. **Set environment variables (Optional)**

   In **Settings** → **Environment variables**:
   - Click **Add variables**
   - Name: `API_KEY`
   - Value: Your custom key (or use default `dev-api-key-change-in-production`)
   - Select environment: Production / Preview
   - Click **Save**

6. **Deploy**
   - Click **Save and Deploy**
   - Every push to GitHub will auto-redeploy

✅ **Done!** Now every push to GitHub automatically deploys your Worker.

#### Option 2: Local CLI Deploy (Quick Test)

```bash
npm run deploy
```

Uses default API key: `dev-api-key-change-in-production`

#### Option 3: CLI Deploy with Custom Config

**Method A: Via wrangler.toml**

Uncomment and set in `wrangler.toml`:
```toml
[vars]
API_KEY = "your-super-secret-production-key"
```

**Method B: Via Cloudflare Dashboard (Recommended)**

1. Deploy worker: `npm run deploy`
2. Visit [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages
3. Select your worker → Settings → Variables
4. Add environment variable:
   - Name: `API_KEY`
   - Value: `your-super-secret-production-key`
5. Click **Save and Deploy**

**Method C: Via Wrangler Secret (Encrypted)**
```bash
npx wrangler secret put API_KEY
# Enter your secret key when prompted
```

⚠️ **Security**: For production, always use a strong API key with 20+ characters including uppercase, lowercase, numbers, and special characters. Generate one with:
```bash
openssl rand -base64 32
```

## 📖 Usage

### Option 1: Web UI (Recommended) 👍

1. **Open your browser** and navigate to your Worker URL (local: `http://localhost:8787`)

2. **Login** with your API Key:
   - Development (default): `dev-api-key-change-in-production`
   - Production: Your custom API key from environment variables or `wrangler.toml`

3. **Manage your database**:
   - **📊 Tables** - View all tables, create new ones, inspect schemas, delete tables
   - **📝 Data Browser** - Browse and edit table data with full CRUD operations
   - **⚡ SQL Query** - Execute custom SQL queries and view results

#### Creating a Table

**Option A: Visual Builder (No SQL Required)** 🎨

1. Click the **Tables** tab
2. Click **🎨 Visual Builder** button
3. Enter table name (e.g., `users`)
4. Click **➕ Add Field** to add fields:
   - Field 1: `id` → INTEGER, check NOT NULL, select as Primary Key with Auto Increment
   - Field 2: `name` → TEXT, check NOT NULL
   - Field 3: `email` → TEXT, check UNIQUE
   - Field 4: `age` → INTEGER
   - Field 5: `created_at` → DATETIME, default: `CURRENT_TIMESTAMP`
5. Review the generated SQL in the preview
6. Click **Create Table**

**Option B: SQL Editor** 📝

1. Click the **Tables** tab
2. Click **📝 SQL Editor** button
3. Enter SQL:
   ```sql
   CREATE TABLE users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     email TEXT UNIQUE,
     age INTEGER,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   )
   ```
4. Click **Create**

#### Adding Fields to Existing Tables

1. Click the **Tables** tab
2. Click **⚙️ Manage Fields** button
3. Select a table from the dropdown
4. View current fields with their types and constraints
5. In "Add New Field" section:
   - Enter field name (e.g., `phone`)
   - Select field type (e.g., TEXT)
   - Check constraints if needed (NOT NULL, UNIQUE)
   - Enter default value (optional)
6. Click **Add Field to Table**

#### Managing Data

1. Click the **Data Browser** tab
2. Select a table from the dropdown
3. **Search Data** - Use the search box to filter rows in real-time
4. **Sort Columns** - Click any column header to sort (click again to reverse)
5. **Add Row** - Click "Add Row" button and fill the form
6. **Edit Row** - Click the edit icon (✏️) on any row
7. **Delete Row** - Click the delete icon (🗑️)
8. **Export Data** - Click "Export" button to download as CSV or JSON

#### Running SQL Queries

1. Click the **SQL Query** tab
2. Enter your SQL:
   ```sql
   SELECT * FROM users WHERE age > 25 ORDER BY name;
   ```
3. Press **Ctrl+Enter** or click **Execute** button
4. View results in the table below
5. Click **Export Results** to download query results as CSV or JSON

### Option 2: REST API

All API requests require authentication header:
```
Authorization: Bearer your-api-key-here
```

#### Database Management

**List all tables**
```bash
GET /api/tables
```

Response:
```json
{
  "success": true,
  "data": [
    { "name": "users", "type": "table" },
    { "name": "posts", "type": "table" }
  ]
}
```

**Get table schema**
```bash
GET /api/tables/:table/schema
```

**Execute custom SQL**
```bash
POST /api/query
Content-Type: application/json

{
  "sql": "SELECT * FROM users WHERE age > ?",
  "params": [18]
}
```

**Create table**
```bash
POST /api/tables
Content-Type: application/json

{
  "sql": "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)"
}
```

**Drop table**
```bash
DELETE /api/tables/:table
```

#### Data Operations (CRUD)

**Get table rows** (with pagination)
```bash
GET /api/tables/:table/rows?page=1&limit=50
```

**Get single row**
```bash
GET /api/tables/:table/rows/:id
```

**Insert row**
```bash
POST /api/tables/:table/rows
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

**Update row**
```bash
PUT /api/tables/:table/rows/:id
Content-Type: application/json

{
  "name": "John Updated",
  "age": 31
}
```

**Delete row**
```bash
DELETE /api/tables/:table/rows/:id
```

## 💻 Example Code

### JavaScript/Node.js Client

```javascript
const API_KEY = 'your-api-key-here';
const BASE_URL = 'https://your-worker.workers.dev';

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response.json();
}

// List all tables
const tables = await apiRequest('/api/tables');
console.log(tables);

// Insert a record
const result = await apiRequest('/api/tables/users/rows', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Alice',
    email: 'alice@example.com',
    age: 25
  }),
});
console.log(result);

// Query data
const users = await apiRequest('/api/tables/users/rows?page=1&limit=10');
console.log(users);
```

See `examples/api-client.js` for a complete client implementation.

### cURL Examples

```bash
# Set variables
API_KEY="your-api-key-here"
BASE_URL="https://your-worker.workers.dev"

# List tables
curl -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/tables"

# Create table
curl -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sql":"CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)"}' \
  "$BASE_URL/api/tables"

# Insert data
curl -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}' \
  "$BASE_URL/api/tables/users/rows"

# Query data
curl -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/tables/users/rows?page=1&limit=10"
```

See `examples/test-api.sh` for a complete test script.

## 📁 Project Structure

```
d1-sql-studio/
├── src/
│   ├── index.ts      # Main Worker entry point
│   ├── router.ts     # API route handlers
│   ├── db.ts         # D1 database operations
│   ├── auth.ts       # Authentication middleware
│   ├── types.ts      # TypeScript type definitions
│   └── ui.ts         # Web UI interface
├── examples/
│   ├── test-api.sh   # API testing script
│   └── api-client.js # JavaScript client example
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── wrangler.toml     # Cloudflare Workers config
└── README.md         # This file
```

## 🎯 Key Features

### Security
- ✅ API Key authentication for all requests
- ✅ Password input for API key in login form
- ✅ Secure session storage (localStorage)
- ✅ CORS configuration
- ✅ SQL injection protection via parameterized queries

### Performance
- ✅ Serverless architecture on Cloudflare's global network
- ✅ Pagination for large datasets
- ✅ Efficient D1 database queries
- ✅ Minimal bundle size (no external dependencies)

### Developer Experience
- ✅ TypeScript for type safety
- ✅ Clean, modular code structure
- ✅ Comprehensive API documentation
- ✅ Example code and test scripts
- ✅ Easy deployment with Wrangler

## 🔒 Security Best Practices

### For Production Use

1. **Strong API Key**
   - Use a randomly generated key (32+ characters)
   - Include uppercase, lowercase, numbers, and symbols
   - Generate with: `openssl rand -base64 32`

2. **HTTPS Only**
   - Always use HTTPS in production
   - Cloudflare Workers automatically provide HTTPS

3. **Regular Key Rotation**
   - Change your API key monthly
   - Update all clients after rotation

4. **Access Control**
   - Only share API key with trusted team members
   - Consider IP whitelisting (requires code modification)

5. **Monitoring**
   - Use Cloudflare Analytics to monitor access
   - Set up alerts for unusual activity

### Optional: IP Whitelisting

Add this to `src/index.ts` for IP-based restrictions:

```typescript
const ALLOWED_IPS = ['1.2.3.4', '5.6.7.8'];

if (!ALLOWED_IPS.includes(request.headers.get('cf-connecting-ip'))) {
  return new Response('Forbidden', { status: 403 });
}
```

## 🎨 UI Features

### Design
- **Light/Dark Mode** - Toggle themes with persistent preference
- Modern gradient color scheme (purple/blue)
- Card-based layout for clean content organization
- Smooth animations and transitions
- Loading states with spinners
- Success/error toast notifications

### Enhanced Functionality
- **Auto-login** - Remembers API key in localStorage
- **State preservation** - Remembers last selected table and theme
- **Keyboard Shortcuts**:
  - `Ctrl+Enter` / `Cmd+Enter` - Execute SQL query
  - `Esc` - Close open modals
  - `Enter` - Submit forms
- **Real-time Search** - Filter table data as you type
- **Column Sorting** - Click headers to sort, visual indicators for sort direction
- **Data Export** - One-click export to CSV or JSON format
- **Responsive** - Works on all screen sizes
- **Fast** - Async loading, no page refreshes

## 🛠️ Development

### Local Development

```bash
npm run dev
```

Access at `http://localhost:8787`

### Type Checking

```bash
npx tsc --noEmit
```

### Testing

Run the included test script:

```bash
cd examples
./test-api.sh
```

## 📊 Comparison

| Feature | D1 SQL Studio | phpMyAdmin | MySQL Workbench |
|---------|---------------|------------|-----------------|
| Deployment | Cloudflare Workers | Requires server | Desktop app |
| Access | Browser-based | Browser-based | Local install |
| D1 Support | ✅ Native | ❌ | ❌ |
| REST API | ✅ Built-in | ❌ | ❌ |
| Serverless | ✅ | ❌ | ❌ |
| Setup | ~5 minutes | ~30 minutes | ~10 minutes |
| Cost | Free tier available | Server costs | Free |

## ⚙️ Configuration

### Zero-Config Philosophy

This project is designed for **minimal configuration**:
- **Development**: Works out-of-the-box with default settings
- **Production**: Configure only what you need via environment variables

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_KEY` | No | `dev-api-key-change-in-production` | API authentication key |

### Configuration Priority (from highest to lowest)

1. **Wrangler Secrets** (most secure for production)
   ```bash
   npx wrangler secret put API_KEY
   ```

2. **Cloudflare Dashboard** → Settings → Environment Variables

3. **wrangler.toml** `[vars]` section
   ```toml
   [vars]
   API_KEY = "your-key"
   ```

4. **Default values** (hardcoded in code)

### Database Binding

The D1 database is automatically bound via `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "d1-sql-studio-db"
database_id = "your-database-id"
```

After binding, the database is accessible in code via `env.DB` - no additional configuration needed.

## 🐛 Troubleshooting

### Login fails with "Invalid API Key"

- **Development**: Use default key `dev-api-key-change-in-production`
- **Production**: Check your configured API_KEY in:
  - Cloudflare Dashboard → Settings → Environment Variables
  - Or `wrangler.toml` `[vars]` section
  - Or wrangler secrets: `npx wrangler secret list`
- Ensure no extra spaces in the key
- Restart dev server: `npm run dev` or redeploy: `npm run deploy`

### "Database not found" error

- Verify you created the D1 database: `npx wrangler d1 create d1-sql-studio-db`
- Check `database_id` in `wrangler.toml` matches the created database
- Ensure Wrangler version >= 3.0

### Blank page after login

- Open browser DevTools (F12) and check Console for errors
- Verify browser is up to date (Chrome/Firefox/Safari latest)
- Clear browser cache and reload

### CORS errors

- CORS is pre-configured in the code
- If issues persist, check browser console for specific error
- Verify you're accessing from the correct domain

## 🚧 Roadmap

### Recently Added ✅
- [x] Dark mode with theme persistence
- [x] Data export (CSV/JSON)
- [x] Real-time search and filtering
- [x] Column sorting
- [x] Keyboard shortcuts

### Upcoming Features
- [ ] SQL syntax highlighting
- [ ] Import data (CSV, JSON)
- [ ] Data visualization charts
- [ ] Multi-user support with roles
- [ ] Query history and favorites
- [ ] Database backup/restore
- [ ] Internationalization (i18n)
- [ ] Table relationships visualization
- [ ] Batch operations (bulk delete/update)
- [ ] SQL autocomplete
- [ ] Advanced filters (date range, numeric range)
- [ ] Table pagination for very large tables

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 💬 Support

- 📖 Documentation: This README and `/examples` directory
- 🐛 Bug Reports: Open an issue on GitHub
- 💡 Feature Requests: Open an issue with the "enhancement" label

## 🙏 Acknowledgments

- Built for [Cloudflare D1](https://developers.cloudflare.com/d1/)
- Inspired by phpMyAdmin and MySQL Workbench
- Powered by [Cloudflare Workers](https://workers.cloudflare.com/)

---

**Made with ❤️ for the Cloudflare D1 community**

Get started now: `npm install && npm run dev` 🚀

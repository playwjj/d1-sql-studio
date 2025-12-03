# Changelog

All notable changes to D1 SQL Studio will be documented in this file.

## [2.0.0] - 2024-12-03

### 🏗️ Architecture - Complete Modern Rewrite

#### Major Changes
- **Complete architecture rewrite** using Preact + TypeScript + Vite
- **Component-based architecture** replacing single-file UI
- **Modern build system** with Vite for fast HMR and optimized bundling
- **Workers Sites integration** for static asset serving via KV
- **Separated frontend and backend** codebases (`src/ui/` and `src/worker/`)

#### Frontend Stack
- ⚛️ **Preact 10** - Lightweight React alternative (~3KB)
- 📘 **TypeScript 5** - Full type safety across UI and Worker
- ⚡ **Vite 5** - Lightning-fast dev server with HMR
- 🎨 **Modern CSS** - CSS Variables for theming, animations, responsive design

#### Component Architecture
- **Modular components** - Login, Dashboard, Tables, DataBrowser, QueryEditor
- **Shared components** - Modal, Button, Alert with variants
- **API client layer** - Centralized API communication with `ApiClient` class
- **State management** - React hooks (useState, useEffect)

#### Performance Improvements
- 📦 **Bundle size** reduced to ~28KB (~10KB gzipped)
- ⚡ **Fast loading** with code splitting and tree shaking
- 🔄 **HMR support** for instant development feedback
- 🎯 **Optimized rendering** with Preact's efficient diffing

#### Developer Experience
- 🛠️ **Modern tooling** - Vite dev server, TypeScript checking
- 📂 **Clean structure** - Organized component hierarchy
- 🔧 **Separate configs** - `tsconfig.json` for UI, `tsconfig.worker.json` for Worker
- 📝 **Better type safety** - Full TypeScript coverage

### ✨ Retained Features
- 📊 **Table Management** - View, create, delete tables
- 📝 **Data Browser** - Browse table data with pagination (50 rows/page)
- ⚡ **SQL Query Editor** - Execute custom queries with Ctrl+Enter
- 🔐 **Authentication** - API key-based auth with session persistence
- 🗄️ **Database Detection** - Smart DATABASE_NOT_BOUND detection with setup guide
- 🚫 **System Table Filtering** - Auto-hide `_cf_*` system tables
- 🆔 **UUID Auto-generation** - Auto-generate UUID v4 for empty TEXT primary keys
- 🔑 **Smart field handling** - Show/hide primary key fields appropriately
- 🌐 **REST API** - Complete REST API unchanged

### 🗑️ Removed
- 🌙 **Dark Mode** - Simplified to single light theme
- 🎨 **Visual Table Builder** - To be reimplemented in future version
- ⚙️ **Field Manager** - To be reimplemented in future version
- 🔍 **Search & Filter** - To be reimplemented in future version
- ⬆️⬇️ **Column Sorting** - To be reimplemented in future version
- 📥 **Data Export** - To be reimplemented in future version
- ✏️ **Edit/Delete Row** - UI buttons present, functionality to be implemented

### 🔧 Changed
- **Build process** - Now uses `vite build` instead of bundling into Worker
- **Development workflow** - Separate dev servers for frontend (`npm run dev`) and worker (`npm run dev:worker`)
- **Deployment** - Static assets served via Workers Sites (KV)
- **File structure** - Reorganized into `src/worker/` and `src/ui/` directories

### 📝 Documentation
- **Consolidated documentation** - Single comprehensive README.md in English
- **Removed redundant docs** - Deleted ARCHITECTURE.md, FEATURES.md, MIGRATION_GUIDE.md, TABLE_DESIGNER_GUIDE.md
- **Architecture diagram** - ASCII diagram showing edge architecture
- **Complete API docs** - Full REST API reference with examples
- **Development guide** - Local development, database setup, deployment instructions
- **Troubleshooting section** - Common issues and solutions

### 🎯 Migration Notes
This is a breaking change requiring redeployment. The UI has been completely rewritten but maintains API compatibility. Users will need to:
1. Run `npm install` to get new dependencies
2. Run `npm run build` to build with new system
3. Redeploy with `npm run deploy`

### 🔮 Future Roadmap
- Reimplement Visual Table Builder with Preact
- Add back column sorting and search/filter
- Implement Edit/Delete row functionality
- Add data export (CSV/JSON)
- Consider dark mode with new architecture

---

## [1.2.0] - 2024-12-03

### ✨ Added - Visual Table Designer

#### 🎨 Visual Table Builder
- **Intuitive table creation** without writing SQL
- **10 field types supported**:
  - Basic: INTEGER, TEXT, REAL, BLOB
  - Special: UUID, DATETIME, DATE, TIME, BOOLEAN, JSON
- **Primary key configuration**:
  - Single field primary key
  - Composite primary key (multiple fields)
  - Auto-increment support for INTEGER keys
  - Option for no primary key
- **Field constraints**:
  - NOT NULL
  - UNIQUE
  - DEFAULT values (with smart quote handling)
- **Real-time SQL preview** - See generated SQL as you build
- **Smart type mapping** - UUID, DATETIME, BOOLEAN, JSON automatically map to SQLite types

#### ⚙️ Field Manager
- **ALTER TABLE support** - Add fields to existing tables via UI
- **Current field display** - View all existing fields with types and constraints
- **Visual field cards** - Clean display with badges for constraints (PK, NOT NULL, UNIQUE)
- **Full constraint support** - Add NOT NULL, UNIQUE, and DEFAULT values to new fields
- **Type mapping** - Same special type support as Visual Builder

#### 🎯 UI Improvements
- **Three-button interface** in Tables view:
  - 🎨 Visual Builder - For beginners and quick table creation
  - 📝 SQL Editor - For advanced users who prefer SQL
  - ⚙️ Manage Fields - For adding fields to existing tables
- **Responsive field builder** - Grid layout adapts to screen size
- **Field templates** - Reusable field row component
- **Validation** - Prevents creating incomplete tables

### 📝 Documentation
- Updated README with Visual Builder usage guide
- Added examples for both Visual Builder and SQL Editor
- Documented all supported field types
- Included ALTER TABLE usage instructions

## [1.1.0] - 2024-12-03

### ✨ Added - UI/UX Enhancements

#### 🌙 Dark Mode
- Toggle between light and dark themes
- Theme preference persisted in localStorage
- Smooth transitions between themes
- All UI elements fully support both themes

#### 🔍 Search & Filter
- Real-time search across all table data
- Search box in Data Browser toolbar
- Filters all columns simultaneously
- Instant results as you type

#### ⬆️⬇️ Column Sorting
- Click column headers to sort data
- Visual indicators (↑/↓) show sort direction
- Toggle between ascending and descending
- Supports all data types (text, numbers, dates)

#### ⌨️ Keyboard Shortcuts
- `Ctrl+Enter` / `Cmd+Enter` - Execute SQL query
- `Esc` - Close any open modal
- `Enter` - Submit forms
- Keyboard hints displayed on buttons

#### 📥 Data Export
- Export table data to CSV or JSON
- Export query results to CSV or JSON
- One-click download
- Proper filename generation with timestamp

#### 🎨 Improved UI/UX
- Better loading states with spinners
- Enhanced color scheme for dark mode
- Improved button hover states
- Better form styling
- Tooltips on action buttons
- Responsive toolbar layout

### 🔧 Changed
- Increased data load limit from 50 to 1000 rows for better performance
- Improved table rendering with sort indicators
- Enhanced modal styling for better visibility in dark mode
- Updated alert colors for dark mode compatibility

### 📝 Documentation
- Updated README with new feature descriptions
- Added keyboard shortcuts documentation
- Included usage examples for new features
- Updated roadmap with completed items

## [1.0.0] - 2024-12-03

### 🎉 Initial Release

#### Features
- **Web Management Interface**
  - Secure login with API Key
  - Table management (view, create, delete, schema)
  - Data browser with CRUD operations
  - SQL query editor
  - Responsive design

- **REST API**
  - Full CRUD operations for data
  - Database management endpoints
  - Custom SQL execution
  - Pagination support
  - CORS enabled

- **Security**
  - Bearer token authentication
  - API Key protection
  - SQL injection prevention
  - Secure session storage

---

## Legend

- ✨ Added - New features
- 🔧 Changed - Changes in existing functionality
- 🐛 Fixed - Bug fixes
- 🗑️ Removed - Removed features
- 🔒 Security - Security improvements
- 📝 Documentation - Documentation changes

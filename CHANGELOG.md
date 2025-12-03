# Changelog

All notable changes to D1 SQL Studio will be documented in this file.

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

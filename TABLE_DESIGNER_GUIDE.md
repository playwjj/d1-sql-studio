# D1 SQL Studio - Table Designer Guide

## 🎨 New Visual Table Designer

### Features

#### 1. **Visual Table Builder**
- No SQL knowledge required
- Drag-and-drop field ordering
- Real-time SQL preview
- Field-by-field configuration

#### 2. **Supported Field Types**

##### Standard Types
- `INTEGER` - Whole numbers (-2^63 to 2^63-1)
- `REAL` - Floating point numbers
- `TEXT` - Strings and text data
- `BLOB` - Binary data

##### Special Types for Common Use Cases
- `UUID` - Stored as TEXT, format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- `DATETIME` - Stored as TEXT, ISO 8601 format
- `DATE` - Stored as TEXT, YYYY-MM-DD
- `TIME` - Stored as TEXT, HH:MM:SS
- `BOOLEAN` - Stored as INTEGER (0 or 1)
- `JSON` - Stored as TEXT, validated JSON

#### 3. **Primary Key Options**

##### Single Field Primary Key
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT
);
```

##### UUID Primary Key
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,  -- UUID
  user_id INTEGER,
  created_at DATETIME
);
```

##### Composite Primary Key
```sql
CREATE TABLE user_roles (
  user_id INTEGER,
  role_id INTEGER,
  PRIMARY KEY (user_id, role_id)
);
```

#### 4. **Field Constraints**

- ✅ `NOT NULL` - Field cannot be empty
- ✅ `UNIQUE` - Values must be unique
- ✅ `DEFAULT` - Default value if not provided
- ✅ `CHECK` - Custom validation rule
- ✅ `FOREIGN KEY` - Reference to another table

#### 5. **Auto-generation Options**

For UUID fields:
```sql
-- Option 1: Generate in application
id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16))))

-- Option 2: Manual UUID format (recommended)
id TEXT PRIMARY KEY
-- Then generate UUID in your app: crypto.randomUUID()
```

For DATETIME fields:
```sql
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

---

## 🔧 Field Management

### Add Field to Existing Table

**SQLite/D1 Syntax:**
```sql
ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;
```

**Limitations:**
- ✅ Can add columns
- ❌ Cannot drop columns (requires table rebuild)
- ❌ Cannot modify column type (requires table rebuild)

### Delete Field (Table Rebuild Required)

SQLite doesn't support `DROP COLUMN` directly. Must rebuild:

```sql
-- 1. Create new table without the unwanted column
CREATE TABLE users_new (
  id INTEGER PRIMARY KEY,
  name TEXT,
  -- email column removed
);

-- 2. Copy data
INSERT INTO users_new SELECT id, name FROM users;

-- 3. Drop old table
DROP TABLE users;

-- 4. Rename new table
ALTER TABLE users_new RENAME TO users;
```

### Modify Field (Table Rebuild Required)

Same process as delete, but with modified column definition.

---

## 📝 Usage Examples

### Example 1: Create Table with UUID Primary Key

**Visual Designer:**
1. Click "Create Table" with Visual Designer
2. Table name: `sessions`
3. Add field:
   - Name: `id`
   - Type: `UUID`
   - Primary Key: ✓
4. Add field:
   - Name: `user_id`
   - Type: `INTEGER`
   - Not Null: ✓
5. Add field:
   - Name: `created_at`
   - Type: `DATETIME`
   - Default: `CURRENT_TIMESTAMP`
6. Click "Create"

**Generated SQL:**
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Example 2: User Profile with Multiple Constraints

```sql
CREATE TABLE user_profiles (
  user_id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  is_verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(username) >= 3),
  CHECK (email LIKE '%@%')
);
```

### Example 3: Many-to-Many with Composite Key

```sql
CREATE TABLE user_roles (
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

---

## 🎯 Best Practices

### 1. UUID vs Integer ID

**Use UUID when:**
- ✅ Need globally unique IDs
- ✅ Distributed systems
- ✅ Merging databases
- ✅ Security (non-sequential IDs)

**Use INTEGER when:**
- ✅ Simple applications
- ✅ Better performance
- ✅ Smaller storage
- ✅ Auto-increment needed

### 2. Field Naming Conventions

```sql
-- Good
id, user_id, created_at, is_active, full_name

-- Avoid
Id, userId, createdAt, isActive, fullName (camelCase)
ID, USERID, CREATED_AT (all caps)
```

### 3. Default Values

```sql
-- Timestamps
created_at DATETIME DEFAULT CURRENT_TIMESTAMP

-- Booleans
is_active INTEGER DEFAULT 1
is_deleted INTEGER DEFAULT 0

-- Counters
view_count INTEGER DEFAULT 0
```

### 4. UUID Generation

**In Application (Recommended):**
```javascript
// JavaScript/TypeScript
const id = crypto.randomUUID();
// "550e8400-e29b-41d4-a716-446655440000"

// Then insert
INSERT INTO sessions (id, user_id) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 123);
```

**In Database (SQLite):**
```sql
-- Less readable, but works
id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16))))
-- Generates: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

---

## ⚠️ Important Notes

### SQLite Limitations

1. **No DROP COLUMN**
   - Must rebuild table to remove columns
   - Visual designer will handle this automatically

2. **No ALTER COLUMN**
   - Cannot change column type
   - Must rebuild table

3. **Foreign Keys**
   - Must enable: `PRAGMA foreign_keys = ON;`
   - D1 enables this by default

### UUID Format

D1/SQLite stores UUID as TEXT:
- Format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- Storage: 36 bytes (with hyphens)
- Index-friendly: Use with PRIMARY KEY or UNIQUE

### Performance Tips

1. **Primary Keys**
   - Always define a primary key
   - Use INTEGER AUTOINCREMENT for performance
   - Or use UUID for distributed systems

2. **Indexes**
   - Create indexes on frequently queried columns
   - Don't over-index (slows writes)

3. **Field Types**
   - Use appropriate types
   - INTEGER is fastest for IDs
   - TEXT is fine for UUIDs

---

## 🔜 Coming Soon

- 🎨 Visual field reordering
- 📊 Index management UI
- 🔗 Foreign key relationship diagram
- 📥 Import table structure from JSON
- 📤 Export table structure
- 🔄 One-click table rebuild for modifications


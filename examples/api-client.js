/**
 * D1 SQL Studio API 客户端示例
 * Node.js / Browser 兼容
 */

class D1SQLStudioClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    return response.json();
  }

  async listTables() {
    return this.request('/api/tables');
  }

  async getTableSchema(tableName) {
    return this.request(`/api/tables/${tableName}/schema`);
  }

  async query(sql, params = []) {
    return this.request('/api/query', {
      method: 'POST',
      body: { sql, params },
    });
  }

  async createTable(sql) {
    return this.request('/api/tables', {
      method: 'POST',
      body: { sql },
    });
  }

  async dropTable(tableName) {
    return this.request(`/api/tables/${tableName}`, {
      method: 'DELETE',
    });
  }

  async getRows(tableName, page = 1, limit = 50) {
    return this.request(`/api/tables/${tableName}/rows?page=${page}&limit=${limit}`);
  }

  async getRow(tableName, id) {
    return this.request(`/api/tables/${tableName}/rows/${id}`);
  }

  async insertRow(tableName, data) {
    return this.request(`/api/tables/${tableName}/rows`, {
      method: 'POST',
      body: data,
    });
  }

  async updateRow(tableName, id, data) {
    return this.request(`/api/tables/${tableName}/rows/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteRow(tableName, id) {
    return this.request(`/api/tables/${tableName}/rows/${id}`, {
      method: 'DELETE',
    });
  }
}

// 使用示例
async function example() {
  const client = new D1SQLStudioClient(
    'https://your-worker.workers.dev',
    'your-secret-api-key-here'
  );

  try {
    // 创建表
    console.log('Creating table...');
    await client.createTable(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        age INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 插入数据
    console.log('Inserting data...');
    await client.insertRow('users', {
      name: 'Alice',
      email: 'alice@example.com',
      age: 25
    });

    await client.insertRow('users', {
      name: 'Bob',
      email: 'bob@example.com',
      age: 30
    });

    // 查询数据
    console.log('Fetching all users...');
    const users = await client.getRows('users');
    console.log(users);

    // 查询单个用户
    console.log('Fetching user with ID 1...');
    const user = await client.getRow('users', 1);
    console.log(user);

    // 更新数据
    console.log('Updating user...');
    await client.updateRow('users', 1, {
      name: 'Alice Updated',
      age: 26
    });

    // 自定义查询
    console.log('Custom query...');
    const result = await client.query(
      'SELECT * FROM users WHERE age > ?',
      [25]
    );
    console.log(result);

    // 列出所有表
    console.log('Listing tables...');
    const tables = await client.listTables();
    console.log(tables);

    // 获取表结构
    console.log('Getting schema...');
    const schema = await client.getTableSchema('users');
    console.log(schema);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Node.js 环境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = D1SQLStudioClient;
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.D1SQLStudioClient = D1SQLStudioClient;
}

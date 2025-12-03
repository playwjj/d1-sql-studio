#!/bin/bash

# D1 SQL Studio API 测试脚本
# 使用方法: ./test-api.sh

# 配置
API_KEY="your-secret-api-key-here"
BASE_URL="http://localhost:8787"  # 本地开发服务器
# BASE_URL="https://your-worker.workers.dev"  # 生产环境

echo "========================================="
echo "D1 SQL Studio API 测试"
echo "========================================="
echo ""

# 1. 创建测试表
echo "1️⃣  创建测试表 'users'..."
curl -s -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sql":"CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT, age INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"}' \
  "$BASE_URL/api/tables" | jq '.'
echo ""

# 2. 列出所有表
echo "2️⃣  列出所有表..."
curl -s -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/tables" | jq '.'
echo ""

# 3. 获取表结构
echo "3️⃣  获取 users 表结构..."
curl -s -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/tables/users/schema" | jq '.'
echo ""

# 4. 插入数据
echo "4️⃣  插入测试数据..."
curl -s -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","age":25}' \
  "$BASE_URL/api/tables/users/rows" | jq '.'

curl -s -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@example.com","age":30}' \
  "$BASE_URL/api/tables/users/rows" | jq '.'

curl -s -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie","email":"charlie@example.com","age":28}' \
  "$BASE_URL/api/tables/users/rows" | jq '.'
echo ""

# 5. 查询所有数据
echo "5️⃣  查询所有用户..."
curl -s -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/tables/users/rows" | jq '.'
echo ""

# 6. 查询单条数据
echo "6️⃣  查询 ID=1 的用户..."
curl -s -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/tables/users/rows/1" | jq '.'
echo ""

# 7. 更新数据
echo "7️⃣  更新 ID=1 的用户..."
curl -s -X PUT \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Updated","email":"alice.new@example.com","age":26}' \
  "$BASE_URL/api/tables/users/rows/1" | jq '.'
echo ""

# 8. 执行自定义查询
echo "8️⃣  执行自定义 SQL 查询 (age > 25)..."
curl -s -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT * FROM users WHERE age > ?","params":[25]}' \
  "$BASE_URL/api/query" | jq '.'
echo ""

# 9. 分页查询
echo "9️⃣  分页查询 (page=1, limit=2)..."
curl -s -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/tables/users/rows?page=1&limit=2" | jq '.'
echo ""

# 10. 删除数据
echo "🔟 删除 ID=3 的用户..."
curl -s -X DELETE \
  -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/tables/users/rows/3" | jq '.'
echo ""

# 11. 验证删除
echo "1️⃣1️⃣  验证删除后的数据..."
curl -s -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/tables/users/rows" | jq '.'
echo ""

echo "========================================="
echo "测试完成！"
echo "========================================="

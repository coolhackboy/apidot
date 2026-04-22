### 1. 创建 API Key（带完整配置）

```bash
POST /api/api-keys/create
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "name": "Production API Key",
  "rate_limit": 100,
  "ip_whitelist": ["192.168.1.100", "10.0.0.50"],
  "hourly_credit_limit": 1000,
  "daily_credit_limit": 5000
}
```

**响应：**
```json
{
  "api_key": "sk-xxxxxxxxxxxxxxxxxxxxxx",
  "name": "Production API Key",
  "rate_limit": 100,
  "created_time": "2025-12-11 10:00:00"
}
```

⚠️ **重要**: API Key 只在创建时返回一次，请妥善保管！

---

### 2. 列出所有 API Keys（含实时统计）

```bash
GET /api/api-keys/list
Authorization: Bearer <jwt_token>
```

**响应：**
```json
[
  {
    "id": 123,
    "api_key": "sk-xxxxxxxxxxxxxxxxxxxxxx",
    "name": "Production API Key",
    "rate_limit": 100,
    "ip_whitelist": ["192.168.1.100", "10.0.0.50"],
    "hourly_credit_limit": 1000,
    "daily_credit_limit": 5000,
    "hourly_used": 450,
    "daily_used": 2300,
    "last_used_at": "2025-12-11 15:30:00",
    "created_time": "2025-12-11 10:00:00"
  }
]
```

**字段说明：**
- `ip_whitelist`: IP 白名单（`null` 表示允许所有 IP）
- `hourly_credit_limit`: 每小时积分限制（`0` 表示不限制）
- `daily_credit_limit`: 每日积分限制（`0` 表示不限制）
- `hourly_used`: 过去 1 小时已消费积分（实时）
- `daily_used`: 今日已消费积分（实时）

---

### 3. 更新 API Key 配置

#### 3.1 更新 IP 白名单

```bash
POST /api/api-keys/update
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "key_id": 123,
  "ip_whitelist": ["1.2.3.4", "5.6.7.8"]
}
```

#### 3.2 清空 IP 白名单（允许所有 IP）

```bash
POST /api/api-keys/update
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "key_id": 123,
  "ip_whitelist": []
}
```

#### 3.3 更新积分限制

```bash
POST /api/api-keys/update
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "key_id": 123,
  "hourly_credit_limit": 2000,
  "daily_credit_limit": 10000
}
```

#### 3.4 同时更新多个字段

```bash
POST /api/api-keys/update
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "key_id": 123,
  "name": "Updated Name",
  "rate_limit": 200,
  "ip_whitelist": ["10.0.0.1"],
  "hourly_credit_limit": 1500,
  "daily_credit_limit": 8000
}
```

**响应：**
```json
{
  "message": "API Key updated successfully"
}
```

⚠️ **注意**: 更新后会自动清除缓存，配置立即生效。

---

### 4. 删除 API Key

```bash
POST /api/api-keys/delete
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "key_id": 123
}
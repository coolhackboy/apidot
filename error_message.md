## 📊 管理后台API

所有API都需要管理员权限（`get_current_admin_user`）

### 1. 获取规则列表

```http
GET /api/admin/error-rules?page=1&page_size=10&status=enabled&match_type=keyword&search_keyword=配额
```

**参数：**
- `page`: 页码（默认1）
- `page_size`: 每页数量（默认10，最大100）
- `status`: 状态筛选（enabled/disabled）
- `match_type`: 匹配类型筛选（keyword/regex/error_code）
- `search_keyword`: 搜索关键词

**响应：**
```json
{
  "total": 28,
  "page": 1,
  "page_size": 10,
  "items": [
    {
      "id": 1,
      "rule_name": "内容审核-NSFW",
      "match_type": "keyword",
      "match_value": "[\"NSFW\", \"inappropriate content\"]",
      "normalized_message": "The content does not comply with the platform regulations.",
      "user_prompt": null,
      "priority": 10,
      "status": "enabled",
      "remark": "检测NSFW、敏感内容",
      "created_time": "2025-12-08T10:00:00",
      "updated_time": "2025-12-08T10:00:00"
    }
  ]
}
```

### 2. 创建规则

```http
POST /api/admin/error-rules
Content-Type: application/json

{
  "rule_name": "新规则",
  "match_type": "keyword",
  "match_value": "[\"error1\", \"error2\"]",
  "normalized_message": "用户友好的错误消息",
  "user_prompt": "可选的用户提示",
  "priority": 100,
  "status": "enabled",
  "remark": "规则说明"
}
```

### 3. 更新规则

```http
PUT /api/admin/error-rules/1
Content-Type: application/json

{
  "priority": 50,
  "status": "disabled"
}
```

### 4. 删除规则

```http
DELETE /api/admin/error-rules/1
```

### 5. 更新规则状态

```http
PUT /api/admin/error-rules/1/status
Content-Type: application/json

{
  "status": "enabled"
}
```

### 6. 测试错误匹配

```http
POST /api/admin/error-rules/test
Content-Type: application/json

{
  "error_message": "quota exhausted, please try again later",
  "error_code": null
}
```

**响应：**
```json
{
  "matched": true,
  "matched_rule": {
    "rule_id": 4,
    "rule_name": "配额不足",
    "match_type": "keyword",
    "match_value": "[\"quota\", \"额度\", \"insufficient\"]",
    "normalized_message": "The server is busy or the quota is insufficient.",
    "user_prompt": null,
    "priority": 40
  },
  "normalized_message": "The server is busy or the quota is insufficient.",
  "default_message": "The server is overloaded. Please try again later."
}
```

### 7. 刷新缓存

```http
POST /api/admin/error-rules/refresh-cache
```
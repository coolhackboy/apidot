# 转化率分析功能 (Conversion Analytics)

**实现日期**: 2026-01-26
**分支**: `feature-conversion` (前端) / `feature-conversion-rate` (后端)
**状态**: 已完成

---

## 功能概述

转化率漏斗分析页面，用于追踪用户从 **网页浏览 → 注册 → 付费** 的三步转化数据，支持按日期查询，用于 Google Ads 广告投放的 ROI 分析。

### 页面预览

```
┌─────────────────────────────────────────────────────────────┐
│  转化率分析                          [日期选择器] [导出CSV] │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ UV       │  │ 注册数   │  │ 付费用户  │  │ 总收入      │ │
│  │ 8,500    │  │ 850      │  │ 85       │  │ $4,250      │ │
│  │          │  │ 10%转化  │  │ 10%转化   │  │ ARPU $50   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    转化漏斗图                                │
│    ████████████████████████████████  UV: 8,500              │
│    ████████████                      注册: 850 (10%)        │
│    ████                              付费: 85 (10%)         │
├─────────────────────────────────────────────────────────────┤
│                    趋势图 (折线图)                           │
├─────────────────────────────────────────────────────────────┤
│  流量来源分析表格                                            │
├─────────────────────────────────────────────────────────────┤
│  广告投放ROI分析                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 技术架构

### 数据来源

| 数据类型 | 数据源 | 说明 |
|---------|--------|------|
| PV/UV | Google Analytics 4 Data API | 页面访问和独立访客数据 |
| 注册数据 | 数据库 User 表 | 按 created_time 统计 |
| 付费数据 | 数据库 PaymentRecord 表 | status='completed' 的记录 |
| 广告花费 | Google Ads API | 广告活动花费、点击、展示数据 |

### 关键指标

| 指标 | 计算方式 |
|-----|---------|
| UV | GA4 totalUsers |
| PV | GA4 screenPageViews |
| 注册转化率 | 注册用户数 / UV × 100% |
| 付费转化率 | 付费用户数 / 注册用户数 × 100% |
| ARPU | 总收入 / 付费用户数 |
| CAC | 广告花费 / 付费用户数 |
| ROI | (收入 - 广告花费) / 广告花费 × 100% |
| ROAS | 收入 / 广告花费 |

---

## 文件结构

### 前端 (poyoapi)

```
├── app/[locale]/dashboard/analytics/
│   └── page.tsx                    # 分析页面主组件
├── components/dashboard/analytics/
│   ├── index.ts                    # 组件导出
│   ├── MetricCard.tsx              # 指标卡片组件
│   ├── FunnelChart.tsx             # 转化漏斗图组件
│   ├── SourceBreakdownTable.tsx    # 流量来源分析表格
│   ├── CampaignROISection.tsx      # 广告ROI分析区域
│   └── TimeSeriesChart.tsx         # 趋势折线图组件
├── services/
│   └── analyticsService.ts         # 分析API服务
├── utils/
│   └── source-detector.ts          # 新增 getUtmData() 函数
└── i18n/messages/
    ├── en.json                     # 新增 Dashboard.Analytics
    └── zh.json                     # 新增 Dashboard.Analytics
```

### 后端 (poyoapi-python)

```
├── app/api/dashboard/analytics/
│   ├── __init__.py
│   ├── schemas.py                  # 请求/响应模型
│   ├── services.py                 # 业务逻辑服务
│   └── routes.py                   # API 路由
├── app/services/
│   ├── ga4_service.py              # GA4 Data API 服务
│   └── google_ads_service.py       # Google Ads API 服务
└── app/models/
    └── models.py                   # User 模型新增 UTM 字段
```

---

## API 端点

| 端点 | 方法 | 功能 | 权限 |
|-----|------|------|------|
| `/api/dashboard/analytics/funnel` | GET | 漏斗概览数据 | Admin |
| `/api/dashboard/analytics/source-breakdown` | GET | 按来源分析 | Admin |
| `/api/dashboard/analytics/campaign-roi` | GET | 广告 ROI 分析 | Admin |
| `/api/dashboard/analytics/trend` | GET | 趋势数据 | Admin |

### 通用参数

| 参数 | 类型 | 说明 |
|-----|------|------|
| `time_range` | string | week/month/last7/last14/last30/custom |
| `start_date` | string | YYYY-MM-DD (custom 时必填) |
| `end_date` | string | YYYY-MM-DD (custom 时必填) |

### 响应示例

#### /funnel
```json
{
  "code": 200,
  "data": {
    "summary": {
      "uv": 8500,
      "pv": 25000,
      "registrations": 850,
      "paid_users": 85,
      "total_revenue": 4250.00,
      "arpu": 50.00
    },
    "funnel": {
      "steps": [
        {"name": "UV", "count": 8500, "conversion_rate": 100},
        {"name": "Registration", "count": 850, "conversion_rate": 10.0},
        {"name": "Payment", "count": 85, "conversion_rate": 10.0}
      ],
      "overall_conversion_rate": 1.0
    },
    "ga4_configured": true,
    "date_range": {"start": "2026-01-01", "end": "2026-01-26"}
  }
}
```

---

## 数据库变更

User 表新增字段:

```sql
ALTER TABLE user ADD COLUMN first_utm_source VARCHAR(100) NULL COMMENT '首次来源UTM Source';
ALTER TABLE user ADD COLUMN first_utm_campaign VARCHAR(200) NULL COMMENT '首次来源UTM Campaign';
ALTER TABLE user ADD COLUMN first_utm_medium VARCHAR(100) NULL COMMENT '首次来源UTM Medium';
ALTER TABLE user ADD COLUMN registration_page VARCHAR(500) NULL COMMENT '注册时所在页面路径';
```

---

## 环境变量配置

```env
# GA4 Data API (必需，用于获取 UV/PV 数据)
GA4_PROPERTY_ID=502552702
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Google Ads API (可选，用于获取广告花费数据)
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CLIENT_ID=your_oauth_client_id
GOOGLE_ADS_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
```

---

## 配置步骤

### 1. GA4 Data API 配置

1. 在 [Google Cloud Console](https://console.cloud.google.com/) 启用 "Google Analytics Data API"
2. 创建 Service Account 并下载 JSON 密钥
3. 在 GA4 Property 设置中，为 Service Account 授权「查看者」权限
4. 设置环境变量 `GA4_PROPERTY_ID` 和 `GOOGLE_APPLICATION_CREDENTIALS`

### 2. Google Ads API 配置 (可选)

1. 申请 [Google Ads API Developer Token](https://developers.google.com/google-ads/api/docs/get-started/dev-token)
2. 在 Google Cloud Console 创建 OAuth2 凭证
3. 完成 OAuth2 授权流程获取 Refresh Token
4. 设置相应的环境变量

---

## 访问权限

分析页面仅管理员可访问。

当前管理员判断逻辑 (`app/api/dashboard/analytics/services.py`):
```python
def _is_admin(self, current_user: Dict) -> bool:
    return current_user.get("email") == "goseasp@gmail.com"
```

访问路径: `/dashboard/analytics`

---

## 部署清单

- [ ] 数据库迁移 - User 表新增 4 个 UTM 字段
- [ ] 安装 Python 依赖 - `pip install google-analytics-data google-ads`
- [ ] 配置 GA4 环境变量
- [ ] GA4 授权 - 为 Service Account 授权查看权限
- [ ] (可选) 配置 Google Ads 环境变量

---

## 注意事项

1. **数据延迟**: GA4 数据有 24-48 小时延迟，页面有相应提示
2. **API 配额**: GA4 和 Google Ads API 有请求配额限制，建议后续实现缓存
3. **UTM 一致性**: 确保 GA4 和注册表单使用相同的 UTM 参数格式
4. **降级处理**: 如果 GA4/Ads API 未配置，页面会显示提示但不影响数据库数据展示

---

## Git 提交记录

### 前端 (feature-conversion)
- `d33dc87` - feat: 添加转化率分析页面
- `d08f8ac` - docs: 添加转化率分析功能文档

### 后端 (feature-conversion-rate)
- `e14a6ca` - feat: 添加转化率分析功能

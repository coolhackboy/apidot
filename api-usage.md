#### 获取总费用统计
"""
    获取总积分统计

    - 支持多种时间范围预设
    - 自定义范围最大30天
    - 返回积分数，前端自行计算金额
    - 管理员可查看所有用户数据，普通用户只能查看自己的数据

    Args:
        time_range: 时间范围预设 时间范围: week(本周), month(本月), last7(最近7天), last14(最近14天), last30(最近30天), custom(自定义)
        start_date: 自定义开始日期 开始日期 (YYYY-MM-DD)
        end_date: 自定义结束日期 结束日期 (YYYY-MM-DD)
        uid: 指定用户ID（仅管理员）

    Returns:
        总积分统计数据，包含每日时间序列
```bash
curl -X GET "http://localhost:8002/api/dashboard/total-spend?time_range=month" \
  -H "Authorization: Bearer <your_jwt_token>"
```

{
    "code": 200,
    "data": {
        "total_credits": 378,
        "time_series": [
            {
                "date": "2025-12-01",
                "credits": 32
            },
            {
                "date": "2025-12-02",
                "credits": 15
            },
            {
                "date": "2025-12-03",
                "credits": 15
            },
            {
                "date": "2025-12-04",
                "credits": 5
            },
            {
                "date": "2025-12-05",
                "credits": 301
            },
            {
                "date": "2025-12-09",
                "credits": 10
            }
        ]
    }
}

#### 获取模型费用统计
"""
    获取模型积分统计

    - 按真正的模型编码（model_code）分组统计
    - 返回积分使用最高的 Top N 模型（按积分降序）
    - 每个模型包含每日时间序列
    - 自动获取模型名称
    - 返回积分数，前端自行计算金额
    - 管理员可查看所有用户数据，普通用户只能查看自己的数据

    Args:
        time_range: 时间范围预设
        start_date: 自定义开始日期
        end_date: 自定义结束日期
        uid: 指定用户ID（仅管理员）
        top: 返回 Top N 模型（默认 10，范围 1-100）

    Returns:
        Top N 模型积分统计，包含每个模型的每日时间序列
    """
```bash
curl -X GET "http://localhost:8002/api/dashboard/model-spend?time_range=month" \
  -H "Authorization: Bearer <your_jwt_token>"
```

{
    "code": 200,
    "data": {
        "models": [
            {
                "model_name": "kling-2.6",
                "total_credits": 240,
                "time_series": [
                    {
                        "date": "2025-12-05",
                        "credits": 240
                    }
                ]
            },
            {
                "model_name": "doubao-seedance-4-5",
                "total_credits": 35,
                "time_series": [
                    {
                        "date": "2025-12-03",
                        "credits": 15
                    },
                    {
                        "date": "2025-12-05",
                        "credits": 10
                    },
                    {
                        "date": "2025-12-09",
                        "credits": 10
                    }
                ]
            },
            {
                "model_name": "wan/2-2-animate-replace",
                "total_credits": 22,
                "time_series": [
                    {
                        "date": "2025-12-01",
                        "credits": 7
                    },
                    {
                        "date": "2025-12-02",
                        "credits": 15
                    }
                ]
            },
            {
                "model_name": "sora-2",
                "total_credits": 20,
                "time_series": [
                    {
                        "date": "2025-12-05",
                        "credits": 20
                    }
                ]
            },
            {
                "model_name": "flux-2/flex-text-to-image",
                "total_credits": 18,
                "time_series": [
                    {
                        "date": "2025-12-05",
                        "credits": 18
                    }
                ]
            },
            {
                "model_name": "wan/2-2-animate-move",
                "total_credits": 14,
                "time_series": [
                    {
                        "date": "2025-12-01",
                        "credits": 7
                    },
                    {
                        "date": "2025-12-05",
                        "credits": 7
                    }
                ]
            },
            {
                "model_name": "flux-2/pro-text-to-image",
                "total_credits": 12,
                "time_series": [
                    {
                        "date": "2025-12-01",
                        "credits": 12
                    }
                ]
            },
            {
                "model_name": "flux-2/pro-image-to-image",
                "total_credits": 6,
                "time_series": [
                    {
                        "date": "2025-12-01",
                        "credits": 6
                    }
                ]
            },
            {
                "model_name": "z-image",
                "total_credits": 6,
                "time_series": [
                    {
                        "date": "2025-12-05",
                        "credits": 6
                    }
                ]
            },
            {
                "model_name": "gemini-3-pro-image-preview",
                "total_credits": 5,
                "time_series": [
                    {
                        "date": "2025-12-04",
                        "credits": 5
                    }
                ]
            }
        ],
        "total_credits": 378
    }
}

#### 获取 API Key 费用统计
"""
    获取 API Key 积分统计

    - 按 API Key 维度统计积分
    - NULL 值表示通过 JWT Token 认证的调用
    - 每个 Key 包含每日时间序列
    - 返回积分数，前端自行计算金额
    - 管理员可查看所有用户数据，普通用户只能查看自己的数据

    Args:
        time_range: 时间范围预设
        start_date: 自定义开始日期
        end_date: 自定义结束日期
        uid: 指定用户ID（仅管理员）

    Returns:
        API Key 积分统计，包含每个 Key 的每日时间序列
    """
```bash
curl -X GET "http://localhost:8002/api/dashboard/key-spend?time_range=month" \
  -H "Authorization: Bearer <your_jwt_token>"
```

{
    "code": 200,
    "data": {
        "keys": [
            {
                "api_key_id": 5,
                "api_key": "sk-unQ******JtfrJk",
                "api_key_name": "正式KEY-不要删",
                "total_credits": 312,
                "time_series": [
                    {
                        "date": "2025-12-01",
                        "credits": 6
                    },
                    {
                        "date": "2025-12-02",
                        "credits": 15
                    },
                    {
                        "date": "2025-12-05",
                        "credits": 291
                    }
                ]
            },
            {
                "api_key_id": 6,
                "api_key": "sk-3EV******olkHKQ",
                "api_key_name": "md-test",
                "total_credits": 66,
                "time_series": [
                    {
                        "date": "2025-12-01",
                        "credits": 26
                    },
                    {
                        "date": "2025-12-03",
                        "credits": 15
                    },
                    {
                        "date": "2025-12-04",
                        "credits": 5
                    },
                    {
                        "date": "2025-12-05",
                        "credits": 10
                    },
                    {
                        "date": "2025-12-09",
                        "credits": 10
                    }
                ]
            }
        ],
        "total_credits": 378
    }
}

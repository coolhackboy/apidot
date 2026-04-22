# PoYo API 模型落地页规范文档

> 基于 kie.ai 落地页最佳实践总结，供新建模型落地页参考

---

## 一、页面结构概览

每个模型落地页包含以下核心部分（按顺序）：

| 部分 | JSON Key | 必需 | 说明 |
|------|----------|------|------|
| Meta 信息 | `meta` | ✅ | SEO 标题和描述 |
| Hero 区域 | `hero` | ✅ | 主标题、副标题、CTA |
| 子模型列表 | `subModels` | 可选 | 多版本/变体介绍 |
| 功能特性 | `featureHighlightsWithMedia` | ✅ | 核心功能展示 |
| 应用场景 | `useCase` | ✅ | 目标用户群体 |
| 对比表格 | `comparisonTable` | 推荐 | 与竞品对比 |
| 使用教程 | `howToUse` | ✅ | 集成步骤 |
| 定价信息 | `pricing` | ✅ | 价格和套餐 |
| 常见问题 | `faq` | ✅ | Q&A 列表 |
| 选择理由 | `whyChooseUs` | 推荐 | 平台优势 |

---

## 二、各部分标题规范（多方案参考）

> 以下标题方案基于 kie.ai 多个模型页面总结，每个部分提供 2-4 个可选方案

### Hero 标题方案

| 方案 | 模板 | 示例 |
|------|------|------|
| A - 价值导向 | "Affordable {Model} API" | "Affordable Sora 2 API" |
| B - 功能导向 | "{Model} API - {Core Feature}" | "Sora 2 API - Text to Video with Synchronized Audio" |
| C - 品牌组合 | "{Model} API: {Feature} \| PoYo" | "Nano Banana Pro API: Gemini 3 Pro Image Integration \| PoYo" |
| D - 产品线 | "{Model} API & {Model} Pro API" | "Nano Banana API & Nano Banana Pro API" |

**kie.ai 实际案例：**
- "The Most Affordable and Stable Sora 2 API"
- "Affordable Kling 2.1 API"
- "Affordable Kling 2.6 API with Native Audio on Kie AI"
- "Kie AI Music API for Cost-Effective AI Music Integration"
- "MiniMax Hailuo 2.3 API & Hailuo 2.3 Fast API"
- "Affordable Seedream 4.5 API & Seedream v4.5 Edit Image API"

---

### subModels 标题方案

| 方案 | 模板 | 示例 |
|------|------|------|
| A - 可用模型 | "Available {Model} API Models on PoYo" | "Available Sora 2 API Models on PoYo" |
| B - 版本概览 | "Overview of {Model} API Versions: {Version1}, {Version2}, and {Version3}" | "Overview of Kling 2.1 API Versions: Standard, Pro, and Master" |
| C - 支持模型 | "Supported Models in {Model} API on PoYo" | "Supported Models in Seedream 4.5 API on PoYo" |
| D - 灵活输出 | "Flexible Output Levels for Developers With PoYo's {Model} API" | "Flexible Output Levels for Developers With PoYo's Sora 2 API" |
| E - 模型家族 | "Meet the {Model} API Family: {Variant1} & {Variant2}" | "Meet the Nano Banana API Family: Standard & Pro Image Models" |
| F - 模型访问 | "{Model} API Models Accessible on PoYo" | "Hailuo AI Video Models Accessible on PoYo" |

**kie.ai 实际案例：**
- "Flexible Output Levels for Developers With Kie.ai's Sora 2 API"
- "Overview of Kling 2.1 API Versions: Standard, Pro, and Master"
- "Supported Models in Seedream 4.5 API on Kie AI"
- "Meet the Nano Banana API Family: Standard & Pro Image Models"
- "Hailuo AI Video Models Accessible on Kie.ai"
- "Available Models of Veo 3.1 API on Kie AI"

---

### featureHighlightsWithMedia 标题方案

| 方案 | 模板 | 示例 |
|------|------|------|
| A - 核心特性 | "Key Features of {Model} API" | "Key Features of Sora 2 API" |
| B - 主要功能 | "Main Features of {Model} API" | "Main Features of Kie AI Music API" |
| C - 新功能对比 | "{Model} — What's New in {Model} API" | "Bytedance Seedream 4.0 to Seedream 4.5 — What's New in Seedream 4.5 API" |
| D - 新能力 | "New Capabilities of {Model} API" | "New Capabilities of Google Veo 3.1 API" |
| E - 技术规格 | "Technical Specifications: Unleashing the Power of {Model} API" | "Technical Specifications: Unleashing the Power of Nano Banana Pro API" |
| F - 原生能力 | "Native {Feature} Capabilities of the {Model} API" | "Native Audio Capabilities of the Kling 2.6 API" |

**kie.ai 实际案例：**
- "Key Features of Sora 2 API"
- "Key Features of MiniMax Hailuo 2.3 API"
- "Main Features of Kie AI Music API"
- "New Capabilities of Google Veo 3.1 API"
- "Native Audio Capabilities of the Kling 2.6 API"
- "Technical Specifications: Unleashing the Power of Nano Banana Pro API"

---

### useCase 标题方案

| 方案 | 模板 | 示例 |
|------|------|------|
| A - 谁能受益 | "Who Can Benefit from {Model} API?" | "Who Can Benefit from Sora 2 API?" |
| B - 你能创建 | "What Can You Create with {Model} API" | "What Can You Create with Kling Video 2.6 Model" |
| C - 你能构建 | "What Can You Build With the {Model} API" | "What Can You Build With the Hailuo 2.3 API" |
| D - 用例驱动 | "Use Cases Powered by the {Model} API on PoYo" | "Use Cases Powered by the Seedream 4.5 API on PoYo" |

**kie.ai 实际案例：**
- "Who Can Benifit from Sora 2 API?"
- "What You Can Create with Kling Video 2.6 Model"
- "What Can You Build With the Hailuo 2.3 API"
- "Use Cases Powered by the Seedream 4.5 API on Kie AI"
- "What You Can Build with the Previous Nano Banana API"

---

### comparisonTable 标题方案

| 方案 | 模板 | 示例 |
|------|------|------|
| A - 模型对比 | "{Model} API vs {Competitors} — Model Comparison" | "Sora 2 API vs Kling 2.6, Veo 3.1, Wan 2.6 — Model Comparison" |
| B - 简洁对比 | "{Model} vs {Competitor} — What's Improved?" | "Seedream 4.5 vs Seedream 4.0 — What's Improved?" |
| C - 产品对比 | "{Model} vs {Competitor}" | "Nano Banana Pro vs Seedream 4.5" |
| D - 平台对比 | "{Model} API Pricing Comparison: PoYo vs {Competitor1} vs {Competitor2}" | "Sora 2 API Pricing Comparison: PoYo vs OpenAI vs Fal.ai" |
| E - 竞品对比 | "{Model} API vs Competitors" | "Kie AI Music API vs Competitors" |
| F - 平台内对比 | "{Model1} vs {Model2} on PoYo" | "Kling 2.6 Pro vs Veo 3.1 on PoYo" |

**kie.ai 实际案例：**
- "Sora 2 vs Veo 3 — Model Comparison"
- "Sora 2 API Pricing Comparison: Kie.ai vs OpenAI vs Fal.ai"
- "Seedream 4.5 vs Seedream 4.0 — What's Improved?"
- "Nano Banana Pro vs Seedream 4.5"
- "Kling 2.6 Pro vs Veo 3.1 on Kie AI"
- "Kie AI Music API vs Competitors"

---

### howToUse 标题方案

| 方案 | 模板 | 示例 |
|------|------|------|
| A - 如何使用 | "How to Use {Model} API on PoYo" | "How to Use Sora 2 API on PoYo" |
| B - 如何集成 | "How to Integrate {Model} API on PoYo" | "How to Integrate Kling 2.1 API on PoYo" |
| C - 如何访问 | "How to Access {Model} AI Generation APIs" | "How to Access Nano Banana AI Image Generation APIs" |
| D - 如何使用+Playground | "How to Use the {Model} API and Playground on PoYo" | "How to Use the Kling 2.6 API and Playground on PoYo" |

**kie.ai 实际案例：**
- "How to Use Sora 2 API on Kie.ai"
- "How to Integrate Kling 2.1 API on Kie.ai"
- "How to Access Nano Banana AI Image Generation APIs"
- "How to Use the Kling 2.6 API and Playground on Kie AI"
- "How to Use Seedream 4.5 API on Kie AI"
- "How to Use AI Music API on Kie.ai"

---

### pricing 标题方案

| 方案 | 模板 | 示例 |
|------|------|------|
| A - 价值描述 | "{Model} API Pricing: {Value Proposition}" | "Sora 2 API Pricing: Simple and Affordable" |
| B - 平台定价 | "{Model} API Pricing on PoYo" | "Nano Banana Pro API Pricing on PoYo" |
| C - 灵活选项 | "{Model} API Pricing: Affordable and Flexible Options" | "Kling API Pricing: Affordable and Flexible Options" |
| D - 多模型定价 | "{Model1} and {Model2} Pricing on PoYo" | "Nano Banana API (Gemini 2.5) and Nano Banana Pro API (Gemini 3 Pro Image) Pricing on PoYo" |

**kie.ai 实际案例：**
- "Sora 2 API Pricing Comparison: Kie.ai vs OpenAI vs Fal.ai"
- "Kling API Pricing: Affordable and Flexible Options"
- "Nano Banana API (Gemini 2.5) and Nano Banana Pro API (Gemini 3 Pro Image) Pricing on Kie.ai"
- "Affordable 4o Image API Pricing on Kie.ai"

---

### faq 标题方案

| 方案 | 模板 | 示例 |
|------|------|------|
| A - 完整问法 | "Frequently Asked Questions about {Model} API" | "Frequently Asked Questions about Sora 2 API" |
| B - 简洁版 | "Frequently Asked Questions" | "Frequently Asked Questions" |
| C - 常见问答 | "Common Questions & Answers" | "Common Questions & Answers" |

**kie.ai 实际案例：**
- "Frequently Asked Questions"
- "Common Questions & Answers"
- "Frequently Asked Questions about Kling 2.1 API"

---

### whyChooseUs 标题方案

| 方案 | 模板 | 示例 |
|------|------|------|
| A - 为什么使用 | "Why Use PoYo for {Model} API Access" | "Why Use PoYo for Sora 2 API Access" |
| B - 为什么选择 | "Why Choose PoYo for {Model} API Integration" | "Why Choose PoYo for Seedream 4.5 API Integration" |
| C - 为什么通过 | "Why to Use {Model} API via PoYo" | "Why to Use Hailuo 2.3 API via PoYo" |
| D - 为什么集成 | "Why Choose PoYo for {Model} API Integration?" | "Why Choose PoYo for Hailuo AI API Integration" |

**kie.ai 实际案例：**
- "Why Use Kie AI for Veo 3.1 API Access"
- "Why Choose Kie.ai for AI Music API Integration"
- "Why Choose Kie AI for Bytedance Seedream 4.5 API Integration?"
- "Why to Use Hailuo 2.3 API via Kie.ai"
- "Why Choose Kie.ai for Hailuo AI API Integration"
- "Why Choose Kie.ai for Nano Banana & Nano Banana Pro API Integration"

---

### 标题风格原则

1. **描述性短语** - 使用 "Key Features of X API" 而非 "X API Features"
2. **价值导向** - 在标题中加入价值描述，如 "Affordable", "Simple", "Cost-Effective"
3. **问句形式** - 用户场景用问句 "Who Can Benefit from...?", "What Can You Create...?"
4. **动作导向** - 教程用 "How to Use...", "How to Integrate...", "How to Access..."
5. **品牌自然融入** - "on PoYo" 放在句尾，避免 "(PoYo)" 括号形式
6. **避免特殊符号** - 页面内容中不使用 `|` 等 meta 专用符号
7. **对比用破折号** - 使用 "—" 连接对比内容，如 "vs ... — Model Comparison"
8. **版本号保留** - 模型版本号完整保留，如 "Kling 2.6", "Veo 3.1"

---

## 三、Hero 区域规范

### 结构
```json
{
  "hero": {
    "title": "主标题",
    "description": "副标题描述",
    "cta": {
      "text": "CTA按钮文案",
      "href": "/dashboard/api-key"
    }
  }
}
```

### 主标题写法
- 格式: `{Model} API - {Core Value Proposition}`
- 示例:
  - "Sora 2 API - AI Video Generation with Audio"
  - "Nano Banana Pro API - Google's Revolutionary Next-Gen Image AI"
  - "Affordable Kling 2.1 API" (kie.ai 风格)

### 副标题写法要点
1. **开头强调即时可用**: "Access X API instantly on PoYo—no waitlist required"
2. **列出2-3个核心特性**: "with synchronized audio, realistic physics, and cinematic quality"
3. **结尾点明价值**: "Professional text-to-video generation with instant API access"

### CTA 按钮文案
- 主要: "Get API Key", "Create API Key"
- 备选: "Try for Free", "Start Creating"

---

## 四、功能特性规范 (featureHighlightsWithMedia)

### 结构
```json
{
  "featureHighlightsWithMedia": {
    "title": "Key Features of {Model} API",
    "subtitle": "简短的功能总结描述",
    "items": [
      {
        "title": "功能标题",
        "description": "<p>功能详细描述</p>",
        "bullets": ["要点1", "要点2", "要点3"],
        "media": {
          "type": "video|image",
          "src": "媒体URL"
        }
      }
    ]
  }
}
```

### 功能标题写法
- 简洁明了，5-10个单词
- 强调用户收益，非技术术语
- 示例:
  - "Synchronized Audio Generation (Dialogue + SFX)"
  - "4K Image Generation for Commercial Assets"
  - "Realistic Physics & Motion Coherence"

### 功能描述写法
- 50-100字
- 结构: 痛点 → 解决方案 → 收益
- 使用 `<p>` 标签包裹

### Bullets 要点
- 3个要点最佳
- 每条5-10个单词
- 动词开头或特性描述

---

## 五、应用场景规范 (useCase)

### 结构
```json
{
  "useCase": {
    "title": "Who Can Benefit from {Model} API?",
    "items": [
      {
        "icon": "图标名称",
        "title": "场景标题",
        "description": "场景描述"
      }
    ]
  }
}
```

### 常用场景分类

#### 视频模型
- AI video apps and social platforms (Film)
- Creative studios and artists (Brush)
- Media and journalism (Newspaper)
- Marketing and advertising teams (Briefcase)
- Gaming & virtual worlds (Gamepad2)
- E-Learning & Training (GraduationCap)

#### 图片模型
- E-Commerce Product Photography (ShoppingCart)
- Social Media Content (Share2)
- Interior Design & Real Estate (Home)
- Fashion & Apparel Design (Shirt)
- Content Creation & Storyboarding (Film)
- Education & Publishing (GraduationCap)

### 场景描述写法
- 50-80字
- 具体说明使用方式和收益
- 提及模型名称强化关联

---

## 六、对比表格规范 (comparisonTable)

### 结构
```json
{
  "comparisonTable": {
    "title": "{Model} API vs {Competitor1}, {Competitor2}, {Competitor3} — Model Comparison",
    "description": "<p>对比表格说明</p>",
    "featureColumnTitle": "Feature",
    "columns": ["Model1", "Model2", "Model3", "Model4"],
    "highlightColumn": 0,
    "rows": [
      {
        "feature": "对比维度",
        "values": ["值1", "值2", "值3", "值4"]
      }
    ],
    "footnote": "注释说明"
  }
}
```

### 常用对比维度

#### 视频模型
- Input Modes (Text, Image, Reference)
- Typical Clip Length
- Output Resolution
- Native Audio
- Multi-shot / Scene Control
- Character Consistency
- Camera Motion Control

#### 图片模型
- Best For
- Resolution Options
- Editing / Variations
- Text Rendering
- Multi-image Composition
- Price on PoYo

---

## 七、使用教程规范 (howToUse)

### 写法模板

```html
<p><strong>Step 1: Register & Create API Key</strong><br>
描述注册流程...<br>
<a href='/dashboard/api-key'>Create API Key →</a></p>

<p><strong>Step 2: Top Up Credits</strong><br>
描述充值流程...<br>
<a href='/dashboard/billing'>Add Credits →</a></p>

<p><strong>Step 3: Integrate the API</strong><br>
描述集成方式...<br>
<a href='文档链接'>View Documentation →</a></p>
```

### 步骤规范
- 3步最佳 (注册 → 充值 → 集成)
- 每步包含操作说明 + CTA链接
- 链接使用箭头 `→` 符号

---

## 八、定价规范 (pricing)

### 标题写法
- 格式: `{Model} API Pricing: {Value Proposition}`
- 价值描述词: "Simple and Affordable", "Affordable 4K Generation", "Flexible Options"

### 内容要点
1. **核心价格**: 突出显示，使用绿色强调
2. **包含内容**: 用 ✓ 列出包含的功能
3. **无隐藏费用**: 强调 "No subscription fees"
4. **企业方案**: 提及大客户折扣

### 示例
```html
<p><strong>Model:</strong> <span style='color: #10b981; font-weight: bold;'>X credits</span> per generation</p>
<p>✓ 功能1<br>✓ 功能2<br>✓ 功能3</p>
<p>No subscription fees - pay only for what you use.</p>
```

---

## 九、FAQ 规范

### 标题
- "Frequently Asked Questions about {Model} API"

### 常见问题类型
1. **功能介绍**: "What features does X API offer?"
2. **定价问题**: "How much does X API cost on PoYo?"
3. **快速开始**: "How quickly can I start using X API?"
4. **生成时间**: "What's the video/image generation time?"
5. **输入支持**: "Can I use reference images with X API?"
6. **商业使用**: "Is commercial use allowed?"

### 回答规范
- 50-100字
- 直接回答问题
- 包含具体数字和特性
- 结尾可加 CTA 引导

---

## 十、选择理由规范 (whyChooseUs)

### 标题
- "Why Use PoYo for {Model} API Access"

### 常用优势点
1. **Instant Access** - 无等待、即时可用
2. **Best Value / Affordable Pricing** - 价格优势
3. **Premium Quality** - 质量保证
4. **Developer Friendly** - 开发者友好
5. **Reliable & Stable** - 稳定可靠
6. **Trusted by Thousands** - 信任背书

### 描述写法
- 40-60字
- 强调 PoYo 平台优势
- 使用具体数字 (99.9% uptime, 5 minutes setup)

---

## 十一、文案风格指南

### 语调特征
- **专业但易懂**: 避免过度技术术语
- **商业化**: 强调成本效益 (affordable, cost-effective)
- **行动导向**: 鼓励用户立即行动

### 数据支撑
- 使用具体数字: "60% lower cost", "720p resolution", "15 seconds"
- 对比竞品价格
- 强调时间优势: "in under 5 minutes"

### 常用词汇
- **正面词**: affordable, reliable, stable, instant, professional-grade
- **动词**: Generate, Create, Transform, Access, Integrate
- **价值词**: seamless, powerful, advanced, comprehensive

---

## 十二、文件位置

落地页 JSON 文件路径:
```
i18n/pages/landing/{model-slug}/en.json
```

示例:
- `i18n/pages/landing/sora-2/en.json`
- `i18n/pages/landing/nano-banana-2-api/en.json`

---

## 附录: 完整 JSON 结构模板

```json
{
  "meta": {
    "title": "{Model} API - {Core Feature} | PoYo",
    "description": "SEO 描述，150字以内"
  },
  "modelLandingContent": {
    "hero": {
      "title": "{Model} API - {Core Value Proposition}",
      "description": "Access {Model} API instantly on PoYo—no waitlist required. {2-3 core features}. Professional {type} generation with instant API access.",
      "cta": {
        "text": "Get API Key",
        "href": "/dashboard/api-key"
      }
    },
    "subModels": {
      "title": "Available {Model} API Models on PoYo",
      "items": []
    },
    "featureHighlightsWithMedia": {
      "title": "Key Features of {Model} API",
      "subtitle": "功能总结描述",
      "items": []
    },
    "useCase": {
      "title": "Who Can Benefit from {Model} API?",
      "items": []
    },
    "comparisonTable": {
      "title": "{Model} API vs {Competitors} — Model Comparison",
      "description": "<p>对比说明</p>",
      "featureColumnTitle": "Feature",
      "columns": [],
      "highlightColumn": 0,
      "rows": [],
      "footnote": "注释"
    },
    "howToUse": {
      "title": "How to Use {Model} API on PoYo",
      "description": "<p>步骤说明...</p>"
    },
    "pricing": {
      "title": "{Model} API Pricing: {Value Proposition}",
      "description": "<p>定价详情...</p>"
    },
    "faq": {
      "title": "Frequently Asked Questions about {Model} API",
      "items": []
    },
    "whyChooseUs": {
      "title": "Why Use PoYo for {Model} API Access",
      "items": []
    }
  }
}
```

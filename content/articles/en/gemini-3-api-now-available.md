---
title: "Gemini 3 Series API - Flash Preview & Pro Preview Now Available on PoYo"
category: "announcements"
description: "Access Gemini 3 Series API on PoYo - Flash Preview ($0.4/$2.4), Pro Preview ($0.8/$4.8) per 1M tokens. 1M context window, dynamic thinking, multimodal, LMArena #1."
locale: "en"
image: "https://storage.apidot.ai/gemini-3-api/mkywm3fv_9jyka0ca0gl.webp"
author: "Poyo.ai Team"
datePublished: "2026-01-29T10:00:00.000Z"
dateModified: "2026-01-29T10:00:00.000Z"
tags: "gemini 3, google, flash, pro, chat api, multimodal, 1m context, dynamic thinking"
popular: true
---

![Gemini 3 Series API - Flash Preview & Pro Preview](https://storage.apidot.ai/gemini-3-api/mkywm3fv_9jyka0ca0gl.webp)

We're excited to announce that **[Gemini 3 Series API](https://poyo.ai/models/gemini-3-api)**, Google's most advanced AI model family, is now available on PoYo. Access Gemini 3 Flash Preview and Gemini 3 Pro Preview through a unified API with no waitlist, instant access, and competitive pricing.

## What Makes Gemini 3 Series Revolutionary

Gemini 3 represents Google's breakthrough in AI capabilities, featuring the largest context window among frontier models, dynamic thinking levels, and state-of-the-art benchmark performance.

### Gemini 3 Flash Preview - Speed Champion

**Model ID:** `gemini-3-flash-preview`

Gemini 3 Flash Preview is Google's fastest frontier model, designed for rapid iteration and high-volume tasks:

- **3x Faster Than Gemini 2.5 Pro** — Dramatically reduced latency for real-time applications
- **78% SWE-bench Verified** — Strong coding performance for agentic development
- **1M Token Context Window** — Process entire codebases in a single request
- **Dynamic Thinking Levels** — Configure reasoning depth per-request (minimal/low/medium/high)
- **Multimodal Input** — Text, images, audio, video, and PDF processing

**Pricing:** $0.4/1M input tokens, $2.4/1M output tokens

### Gemini 3 Pro Preview - Reasoning Leader

**Model ID:** `gemini-3-pro-preview`

Gemini 3 Pro Preview leads the industry in reasoning capabilities:

- **LMArena #1 with 1501 Elo** — The highest-scoring model on the crowdsourced leaderboard
- **91.9% GPQA Diamond** — PhD-level reasoning accuracy
- **37.5% Humanity's Last Exam** — Exceptional performance on frontier benchmarks
- **MoE Architecture (1T+ Parameters)** — Only 15-20B parameters activated per query for efficiency
- **1M Token Context Window** — Same massive context as Flash

**Pricing:** $0.8/1M input tokens, $4.8/1M output tokens

## Key Features Across Gemini 3 Models

### 1M Token Context Window

Gemini 3 offers the largest context window among frontier models — 1 million tokens. This enables:

- **Full Repository Analysis** — Process entire codebases in a single request
- **Long Document Processing** — Analyze complete research papers, legal documents, and reports
- **Multi-File Context** — Maintain context across hundreds of files simultaneously
- **Automatic Context Caching** — Efficient handling of repeated content

### Dynamic Thinking Levels

Unlike fixed reasoning modes, Gemini 3 offers configurable thinking depth through the `thinking_level` parameter:

| Level | Use Case | Latency | Cost |
|-------|----------|---------|------|
| Minimal | Simple queries, classification | Lowest | Lowest |
| Low | Standard tasks, quick responses | Low | Low |
| Medium | Moderate complexity, balanced | Medium | Medium |
| High | Complex reasoning, deep analysis | Higher | Higher |

This flexibility lets you optimize cost and latency per-request based on task complexity.

### Multimodal Understanding

Gemini 3 supports the richest multimodal input among frontier models:

- **Text** — Natural language prompts and instructions
- **Images** — Visual analysis with configurable resolution (low/medium/high)
- **Audio** — Speech and audio file processing
- **Video** — Video understanding and analysis
- **PDF** — Native PDF document processing

Use the `media_resolution` parameter to control vision processing and optimize token usage.

### Built-in Tools

Gemini 3 natively supports powerful built-in tools without external integrations:

- **Google Search** — Real-time web information retrieval
- **Code Execution** — Run and test code in-context
- **File Search** — Document retrieval and analysis
- **URL Context** — Web page analysis and extraction

These tools enable sophisticated agentic workflows directly within the API.

### Dual API Endpoint Support

PoYo supports two endpoints for Gemini 3 models:

- **`/v1/chat/completions`** — OpenAI-compatible endpoint for SDK compatibility
- **`/v1beta/models/{model}:generateContent`** — Gemini Native Format for full feature access

Both endpoints use the same API key. Choose based on your integration requirements.

## Pricing Comparison

| Model | Input Price | Output Price | Best For |
|-------|-------------|--------------|----------|
| Gemini 3 Flash Preview | $0.4/1M | $2.4/1M | Fast coding & agents |
| Gemini 3 Pro Preview | $0.8/1M | $4.8/1M | Deep reasoning |

All models include:
- 1M token context window
- Dynamic thinking levels
- Multimodal input (text, image, audio, video, PDF)
- Built-in tools (Google Search, Code Execution, File Search)
- /v1/chat/completions and Gemini Native Format endpoints

No subscription fees — pay only for what you use.

## Getting Started with Gemini 3 API

### Step 1: Get API Access

Create your PoYo account and generate your API key in under 2 minutes. No waitlist, no approval process required.

[Create API Key →](/dashboard/api-key)

### Step 2: Try the Playground

Experience Gemini 3's dynamic thinking and multimodal capabilities through our interactive web interface. Test different thinking levels and configurations.

[Try Gemini 3 →](https://poyo.ai/models/gemini-3-api)

### Step 3: Integrate via API

**OpenAI-Compatible Endpoint:**

```bash
curl --request POST \
  --url https://api.poyo.ai/v1/chat/completions \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "gemini-3-flash-preview",
    "messages": [
      {"role": "user", "content": "Explain the theory of relativity."}
    ]
  }'
```

**Gemini Native Format:**

```bash
curl --request POST \
  --url https://api.poyo.ai/v1beta/models/gemini-3-flash-preview:generateContent \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "contents": [
      {"role": "user", "parts": [{"text": "Explain the theory of relativity."}]}
    ],
    "generationConfig": {
      "temperature": 1.0,
      "maxOutputTokens": 4096
    }
  }'
```

[View Full Documentation →](https://docs.poyo.ai/api-manual/chat-series/gemini-native-format)

## Use Cases

### Large Codebase Analysis

Leverage the 1M token context window to analyze entire repositories in a single request. Gemini 3 Flash achieves 78% on SWE-bench Verified, making it ideal for code review, migration planning, and refactoring.

### Research & Knowledge Work

Gemini 3 Pro's LMArena-leading reasoning combined with built-in Google Search enables powerful research workflows. Analyze complex datasets, academic papers, and multi-source information with PhD-level accuracy.

### AI Agent Development

Build sophisticated agents with Gemini 3's built-in tools — Google Search for real-time data, Code Execution for testing, and Function Calling for integrations. Dynamic thinking levels let you optimize cost and latency per-request.

### Enterprise Document Processing

Process massive document collections with the 1M token context. Analyze regulatory filings, market reports, and internal data with multimodal support for text, charts, PDFs, and visual content.

### Multimodal Content Creation

Create rich content workflows with Gemini 3's support for text, images, audio, and video input. Generate descriptions, analyze media, and build multimodal applications.

## Why Choose PoYo for Gemini 3 API

### Instant Access

Start using Gemini 3 API in under 2 minutes. No waitlist, no approval process, no enterprise contracts required.

### Most Affordable Pricing

Access Gemini 3 Flash starting from just $0.4/1M input tokens — the most cost-effective frontier model on the market.

### Production-Grade Reliability

99.9% uptime SLA with automatic failover and traffic spike handling. Built for enterprise applications.

### OpenAI SDK Compatible

Use your existing OpenAI SDK code by simply changing the base URL. Or use Gemini Native Format for full feature access.

---

**Ready to start building with Gemini 3?** [Get your API key](https://poyo.ai/dashboard/api-key) and access Google's most capable models today.

For developers ready to integrate, explore our [comprehensive API documentation](https://docs.poyo.ai/api-manual/chat-series/gemini-native-format) with examples in Python, JavaScript, and cURL.

*Stay at the forefront of AI innovation by following our [blog](https://poyo.ai/hub) and exploring more powerful AI models on PoYo.*

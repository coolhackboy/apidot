---
title: "Comprehensive Add Instrumental API Guide - Generate Musical Accompaniment for Your Vocals"
category: "announcements"
description: "Transform vocals into full tracks with Add Instrumental API on PoYo. Upload audio, specify styles with tags, and generate professional instrumental backing tracks."
locale: "en"
image: "https://storage.poyo.ai/logo.webp"
author: "Poyo.ai Team"
datePublished: "2025-12-05T14:00:00.000Z"
dateModified: "2025-12-05T14:00:00.000Z"
tags: "add instrumental, music generation, ai music, vocal to instrumental, music api"
popular: true
---

We're excited to announce that **[Add Instrumental API](https://poyo.ai/models/add-instrumental)** is now available on PoYo. This powerful AI music generation tool transforms your vocal recordings into full musical tracks by generating professional-quality instrumental accompaniment.

## What is Add Instrumental API?

Add Instrumental API takes an audio file containing vocals or melodies and generates matching instrumental backing tracks. Using advanced AI, it analyzes your audio and creates accompaniment that complements your vocals in the style you specify.

Whether you're a musician looking to quickly prototype ideas, a content creator needing background music, or a producer exploring new arrangements, Add Instrumental API provides a fast and flexible solution.

## Key Features

### **Vocal to Full Track Conversion**
Upload your vocal recording and receive a complete instrumental arrangement. The AI analyzes your melody, rhythm, and style to create accompaniment that fits naturally.

### **Style Tag Control**
Guide the generation with descriptive tags like "acoustic, pop, passionate" or "hip-hop melodico". Use negative tags to exclude unwanted styles like "trap, rap" or "dance pop".

### **Multiple Model Versions**
Choose between model versions:
- **V4_5PLUS** - Balanced quality and speed
- **V5** - Latest model with enhanced capabilities

### **Vocal Gender Selection**
Specify the vocal gender ("m", "f", or "none") to help the AI better understand and complement your audio.

### **Style Weight Control**
Fine-tune how strongly the style tags influence the output with adjustable style weight parameters.

---

## Audio Examples

Listen to real examples of Add Instrumental API in action. Each example shows the original vocal input and the generated instrumental outputs.

### Example 1: "Imparerò a chiamarti amore"

A passionate Italian vocal transformed into an acoustic pop arrangement.

**Input Configuration:**
```json
{
  "title": "Imparerò a chiamarti amore",
  "tags": "acoustic, pop, passionate, love",
  "negative_tags": "trap, rap",
  "mv": "V4_5PLUS",
  "vocal_gender": "m"
}
```

**Original Vocal:**
<audio controls src="https://cdn.doculator.org/files/20251130222235_06ae81a2510e2dc8b9784d46c965b2fa.mp3" style="width: 100%;"></audio>

**Generated Instrumental - Variation 1:**
<audio controls src="https://cdn.doculator.org/audio/0VTN3ZSXRRF2JJVT/20251130222540_RUdBBg_tmpj4zquzrt_audio_78089245-392c-4b0f-83dd-319616306a24.mp3" style="width: 100%;"></audio>

**Generated Instrumental - Variation 2:**
<audio controls src="https://cdn.doculator.org/audio/0VTN3ZSXRRF2JJVT/20251130222600_EWnISS_tmpx1w2mjlw_audio_1da14b42-2a22-4383-95b2-643c07f80f02.mp3" style="width: 100%;"></audio>

---

### Example 2: "Sentimento"

A Portuguese vocal with acoustic pop and melodic hip-hop influences.

**Input Configuration:**
```json
{
  "title": "Sentimento",
  "tags": "Pop acústico ou hip-hop melodico",
  "negative_tags": "Indie pop ou dance pop",
  "mv": "V4_5PLUS"
}
```

**Original Vocal:**
<audio controls src="https://cdn.doculator.org/files/20251130230437_0196c2dade74c83d8f9d104ae21bcba7.mp3" style="width: 100%;"></audio>

**Generated Instrumental - Variation 1:**
<audio controls src="https://cdn.doculator.org/audio/DKAW0FW0E6LUQ3SU/20251130230938_VyNwVs_tmp9falqjqh_audio_35dee8f0-e4e2-4292-b713-2c2e39f56162.mp3" style="width: 100%;"></audio>

**Generated Instrumental - Variation 2:**
<audio controls src="https://cdn.doculator.org/audio/DKAW0FW0E6LUQ3SU/20251130230954_daBg9U_tmpa797exdr_audio_c583044d-6f1a-4408-885f-cd459a687229.mp3" style="width: 100%;"></audio>

---

### Example 3: "Sentimento" (Alternative Style)

The same vocal with slightly different style parameters, demonstrating how tags affect the output.

**Input Configuration:**
```json
{
  "title": "Sentimento",
  "tags": "Pop acústico ou hip-hop melódico",
  "negative_tags": "Dance pop e rap",
  "mv": "V4_5PLUS"
}
```

**Original Vocal:**
<audio controls src="https://cdn.doculator.org/files/20251201121438_cb2d4d53ce09b5ab3429d089298af60b.mp3" style="width: 100%;"></audio>

**Generated Instrumental - Variation 1:**
<audio controls src="https://cdn.doculator.org/audio/XZDJQX8J1LAHQNGW/20251201121745_d8VbFS_tmp0xy924m2_audio_5409c3ee-eb71-4b0d-aca0-4e99d73177de.mp3" style="width: 100%;"></audio>

**Generated Instrumental - Variation 2:**
<audio controls src="https://cdn.doculator.org/audio/XZDJQX8J1LAHQNGW/20251201121728_h98Tx1_tmp4zcbv21j_audio_167954a8-1354-40b6-911b-d8b26cff60fc.mp3" style="width: 100%;"></audio>

---

## API Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `upload_url` | string | Yes | URL of the audio file (vocals/melody) |
| `title` | string | Yes | Song title (max 100 characters) |
| `tags` | string | Yes | Style tags to guide generation |
| `negative_tags` | string | Yes | Styles to avoid in generation |
| `mv` | string | Yes | Model version: "V4_5PLUS" or "V5" |
| `vocal_gender` | string | No | "m", "f", or "none" |
| `style_weight` | number | No | 0-1 range (default 0.5) |

## Pricing

Add Instrumental API is available at **20 credits per generation** ($0.10). Each generation produces multiple variations, giving you options to choose the best fit for your project.

## Getting Started

### **Step 1: Get API Access**
Create your PoYo account and generate your API key. [Get API Key →](/dashboard/api-key)

### **Step 2: Try the Playground**
Experience Add Instrumental through our interactive web interface. Upload your audio, set your style tags, and hear the results. [Try Add Instrumental →](https://poyo.ai/models/add-instrumental)

### **Step 3: Integrate via API**
Use our REST API to integrate Add Instrumental into your applications. [View API Documentation →](https://docs.poyo.ai/api-manual/music-series/add-instrumental)

## Why Choose PoYo for Add Instrumental API

- **Multiple Variations** - Each generation produces multiple instrumental options
- **Style Control** - Fine-tune output with tags and negative tags
- **Fast Generation** - Get results in minutes, not hours
- **Commercial Use** - Use generated audio in your projects
- **Unified Platform** - Access 500+ AI models with one API key

---

**Ready to transform your vocals into full tracks?** [Try Add Instrumental API on PoYo today](https://poyo.ai/models/add-instrumental) and discover the power of AI-generated musical accompaniment.

For developers, explore our [comprehensive API documentation](https://docs.poyo.ai/api-manual/music-series/add-instrumental) with code examples and integration guides.

---

*Explore more AI music tools on PoYo including [Add Vocals](https://poyo.ai/models/add-vocals), [Generate Music](https://poyo.ai/models/generate-music), and [Vocal Remover](https://poyo.ai/models/vocal-remover-api).*

---
title: "How to Use Z-Image API on PoYo: Complete Developer Guide"
category: "tutorials"
description: "Learn how to integrate Z-Image API into your applications. Step-by-step guide with code examples in JavaScript, Python, and cURL for ultra-fast AI image generation."
locale: "en"
image: "https://storage.poyo.ai/uplaod/mispff6t_obqfsyv8c1d.webp"
author: "Poyo.ai Team"
datePublished: "2025-12-05T12:00:00.000Z"
dateModified: "2025-12-05T12:00:00.000Z"
tags: "z-image, api tutorial, image generation, alibaba, developer guide"
popular: true
---

![How to Use Z-Image API on PoYo](https://storage.poyo.ai/uplaod/mispff6t_obqfsyv8c1d.webp)

Z-Image API, powered by Alibaba's innovative S3-DiT architecture, delivers ultra-fast image generation in under one second. This comprehensive guide will walk you through integrating Z-Image's powerful capabilities into your applications using PoYo's API.

## Getting Started with Z-Image API

### Step 1: Set Up Your PoYo Account

First, create your PoYo account and obtain your API credentials:

1. **Sign up** at [PoYo.ai](https://poyo.ai)
2. **Generate your API key** in the [dashboard](https://poyo.ai/dashboard/api-key)
3. **Add credits** to your account (Z-Image costs 2 credits per generation)

### Step 2: Install Required Dependencies

```bash
# For Node.js/JavaScript
npm install axios

# For Python
pip install requests

# For cURL (no installation needed)
```

## Basic Text-to-Image Generation

### JavaScript/Node.js Implementation

```javascript
const axios = require('axios');

const generateImage = async (prompt, size = '1:1') => {
  try {
    const response = await axios.post(
      'https://api.poyo.ai/api/generate/submit',
      {
        model: 'z-image',
        callback_url: 'https://your-domain.com/callback', // Optional webhook
        input: {
          prompt: prompt,
          size: size // Options: '1:1', '4:3', '3:4', '16:9', '9:16'
        }
      },
      {
        headers: {
          'Authorization': `Bearer YOUR_API_KEY`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Task ID:', response.data.data.task_id);
    console.log('Status:', response.data.data.status);
    console.log('Created:', response.data.data.created_time);
    return response.data.data;
  } catch (error) {
    console.error('Error generating image:', error.response?.data || error.message);
  }
};

// Example usage
generateImage('A futuristic city skyline at sunset with flying cars', '16:9');
```

### Python Implementation

```python
import requests
import json

def generate_image(prompt, api_key, size='1:1'):
    url = "https://api.poyo.ai/api/generate/submit"

    payload = {
        "model": "z-image",
        "callback_url": "https://your-domain.com/callback",  # Optional webhook
        "input": {
            "prompt": prompt,
            "size": size  # Options: '1:1', '4:3', '3:4', '16:9', '9:16'
        }
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()

        result = response.json()
        print(f"Task ID: {result['data']['task_id']}")
        print(f"Status: {result['data']['status']}")
        print(f"Created: {result['data']['created_time']}")
        return result['data']

    except requests.exceptions.RequestException as e:
        print(f"Error generating image: {e}")
        return None

# Example usage
api_key = "YOUR_API_KEY"
result = generate_image("A serene mountain landscape with crystal clear lake", api_key, '16:9')
```

### cURL Implementation

```bash
curl -X POST "https://api.poyo.ai/api/generate/submit" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "z-image",
    "callback_url": "https://your-domain.com/callback",
    "input": {
      "prompt": "A professional headshot of a confident business woman in modern office setting",
      "size": "1:1"
    }
  }'
```

## API Parameters

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model` | string | Yes | Must be `"z-image"` |
| `callback_url` | string | No | Webhook URL for async notifications |
| `input.prompt` | string | Yes | Text description (max 1000 characters) |
| `input.size` | string | Yes | Aspect ratio: `1:1`, `4:3`, `3:4`, `16:9`, `9:16` |

### Response Format

```json
{
  "code": 200,
  "data": {
    "task_id": "task-unified-1757165031-uyujaw3d",
    "status": "not_started",
    "created_time": "2025-12-05T10:30:00"
  }
}
```

## Aspect Ratio Guide

Choose the right size for your use case:

```javascript
const sizeGuide = {
  '1:1': 'Square - Social media posts, profile images, thumbnails',
  '4:3': 'Landscape - Presentations, web content, traditional photos',
  '3:4': 'Portrait - Mobile content, portrait photography',
  '16:9': 'Widescreen - Video thumbnails, banners, hero images',
  '9:16': 'Vertical - Stories, reels, mobile-first content'
};

// Generate images for different platforms
const generateForPlatform = async (prompt, platform) => {
  const platformSizes = {
    instagram_post: '1:1',
    instagram_story: '9:16',
    youtube_thumbnail: '16:9',
    twitter_header: '16:9',
    linkedin_post: '4:3'
  };

  return generateImage(prompt, platformSizes[platform]);
};
```

## Handling Results with Webhooks

Z-Image API uses webhooks for result delivery. Set up a webhook endpoint to receive results:

### Setting Up Webhook Endpoint

```javascript
// Express.js webhook handler
const express = require('express');
const app = express();

app.use(express.json());

// Webhook endpoint to receive results
app.post('/webhook/callback', (req, res) => {
  const { task_id, status, files } = req.body;

  console.log(`Task ${task_id} status: ${status}`);

  if (status === 'finished' && files && files.length > 0) {
    console.log('Generated image URL:', files[0].file_url);
    // Process the completed image
    processGeneratedImage(task_id, files[0].file_url);
  } else if (status === 'failed') {
    console.error('Generation failed for task:', task_id);
    handleGenerationError(task_id);
  }

  res.status(200).send('OK');
});

const processGeneratedImage = (taskId, imageUrl) => {
  // Your logic to handle the completed image
  console.log(`Processing image from task ${taskId}: ${imageUrl}`);
};

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

### Alternative: Manual Status Checking

If you prefer not to use webhooks, you can poll the task status:

```javascript
const checkTaskStatus = async (taskId) => {
  try {
    const response = await axios.get(
      `https://api.poyo.ai/api/generate/status/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer YOUR_API_KEY`
        }
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error checking status:', error.message);
    return null;
  }
};

const pollForResult = async (taskId, maxAttempts = 30) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const taskData = await checkTaskStatus(taskId);

    if (!taskData) break;

    console.log(`Status: ${taskData.status}`);

    if (taskData.status === 'finished') {
      console.log('Image generated successfully!');
      if (taskData.files && taskData.files.length > 0) {
        console.log('Image URL:', taskData.files[0].file_url);
      }
      return taskData;
    } else if (taskData.status === 'failed') {
      console.error('Generation failed:', taskData.error_message);
      return null;
    }

    // Wait 1 second (Z-Image is fast!)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.error('Maximum polling attempts reached');
  return null;
};

// Complete workflow example
const completeGeneration = async (prompt, size = '1:1') => {
  // Step 1: Submit generation request
  const generation = await generateImage(prompt, size);

  if (!generation) return null;

  // Step 2: Poll for results
  const result = await pollForResult(generation.task_id);

  return result;
};
```

### Python Status Checking

```python
import time

def check_task_status(task_id, api_key):
    url = f"https://api.poyo.ai/api/generate/status/{task_id}"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()

        return response.json()['data']
    except requests.exceptions.RequestException as e:
        print(f"Error checking status: {e}")
        return None

def wait_for_completion(task_id, api_key, max_attempts=30):
    for attempt in range(max_attempts):
        task_data = check_task_status(task_id, api_key)

        if not task_data:
            break

        print(f"Status: {task_data['status']}")

        if task_data['status'] == 'finished':
            print("Image generated successfully!")
            if task_data.get('files') and len(task_data['files']) > 0:
                print(f"Image URL: {task_data['files'][0]['file_url']}")
            return task_data
        elif task_data['status'] == 'failed':
            print(f"Generation failed: {task_data.get('error_message', 'Unknown error')}")
            return None

        time.sleep(1)  # Wait 1 second

    print("Maximum attempts reached")
    return None

# Complete workflow
def complete_image_generation(prompt, api_key, size='1:1'):
    # Step 1: Submit request
    task_result = generate_image(prompt, api_key, size)

    if not task_result:
        return None

    # Step 2: Wait for completion
    final_result = wait_for_completion(task_result['task_id'], api_key)

    return final_result
```

## Error Handling and Best Practices

### Comprehensive Error Handling

```javascript
const robustImageGeneration = async (prompt, size = '1:1', retries = 3) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.post(
        'https://api.poyo.ai/api/generate/submit',
        {
          model: 'z-image',
          input: {
            prompt: prompt,
            size: size
          }
        },
        {
          headers: {
            'Authorization': `Bearer YOUR_API_KEY`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      return response.data.data;

    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error || 'Unknown error';

        console.error(`API Error (${status}): ${message}`);

        // Don't retry for certain errors
        if (status === 401 || status === 403) {
          throw new Error('Authentication failed. Check your API key.');
        }

        if (status === 400) {
          throw new Error(`Bad request: ${message}`);
        }

      } else if (error.request) {
        console.error('Network error:', error.message);
      } else {
        console.error('Request setup error:', error.message);
      }

      // If this was the last attempt, throw the error
      if (attempt === retries - 1) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retrying in ${delay}ms... (Attempt ${attempt + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

### Best Practices

1. **Keep prompts under 1000 characters** - Z-Image has a maximum prompt length
2. **Use descriptive prompts** - More detail generally produces better results
3. **Cache results** - Store generated images to avoid regenerating identical content
4. **Handle async properly** - Always wait for task completion before using results

## Prompt Engineering Tips

### Effective Prompt Structure

```javascript
// Good prompts for Z-Image
const goodPrompts = [
  // Clear subject + style + details
  "Professional product photo of a sleek smartphone on white background, studio lighting, 4K quality",

  // Scene + atmosphere + composition
  "Cozy coffee shop interior at golden hour, warm lighting, wooden furniture, plants on shelves",

  // Character + action + setting
  "Young woman reading a book in a modern library, natural light from large windows, peaceful atmosphere",

  // Text rendering (Z-Image excels at this)
  "Minimalist poster design with text 'INNOVATION 2025' in bold typography, blue gradient background"
];

// Prompts optimized for bilingual text
const textPrompts = [
  "Store sign with 'OPEN' in English and '营业中' in Chinese, neon style",
  "Business card design with company name 'TechFlow 科技流' in elegant font"
];
```

### Batch Processing

```javascript
const generateBatch = async (prompts, size = '1:1') => {
  // Submit all generation requests in parallel
  const generations = await Promise.all(
    prompts.map(prompt => generateImage(prompt, size))
  );

  // Wait for all results
  const results = await Promise.all(
    generations
      .filter(gen => gen !== null)
      .map(gen => pollForResult(gen.task_id))
  );

  return results.filter(result => result !== null);
};

// Example: Generate multiple social media images
const socialMediaPrompts = [
  "Motivational quote background with sunrise",
  "Abstract geometric pattern in blue and purple",
  "Minimalist workspace setup with laptop"
];

const images = await generateBatch(socialMediaPrompts, '1:1');
```

## Conclusion

Z-Image API on PoYo provides ultra-fast, high-quality image generation with exceptional bilingual text rendering capabilities. With its simple two-parameter API (prompt and size), you can integrate powerful image generation into your applications in minutes.

For more advanced features and complete API documentation, visit the [official Z-Image API documentation](https://docs.poyo.ai/api-manual/image-series/z-image).

Ready to start building? [Get your API key](https://poyo.ai/dashboard/api-key) and begin creating with Z-Image today.

---

*Need help with implementation? Join our [developer community](https://poyo.ai/support) or check out more [API tutorials](https://poyo.ai/hub) for advanced techniques.*

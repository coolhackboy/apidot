---
title: "How to Use Nano Banana 2 API on PoYo: Complete Developer Guide"
category: "tutorials"
description: "Learn how to integrate Nano Banana 2 API powered by Gemini 3 Pro Preview into your applications. Step-by-step guide with code examples for the revolutionary 5-step workflow."
locale: "en"
image: "https://storage.apidot.ai/upload/mi7lhu1q_gfzuxlx4dvv.webp"
author: "Poyo.ai Team"
datePublished: "2025-11-20T12:00:00.000Z"
dateModified: "2025-11-20T12:00:00.000Z"
tags: "nano banana 2, api tutorial, image generation, gemini, developer guide"
popular: true
---

![How to Use Nano Banana 2 API on PoYo](https://storage.apidot.ai/upload/mi7lhu1q_gfzuxlx4dvv.webp)

Nano Banana 2 API, powered by Google's Gemini 3 Pro Preview, introduces revolutionary capabilities in AI image generation. This comprehensive guide will walk you through implementing the world's first 5-step workflow (Plan → Generate → Review → Refine → Iterate) in your applications using PoYo's API.

## Getting Started with Nano Banana 2 API

### Step 1: Set Up Your PoYo Account

First, create your PoYo account and obtain your API credentials:

1. **Sign up** at [PoYo.ai](https://poyo.ai)
2. **Generate your API key** in the [dashboard](https://poyo.ai/dashboard/api-key)
3. **Add credits** to your account (Nano Banana 2 costs 5 credits per generation)

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
        model: 'nano-banana-2',
        callback_url: 'https://your-domain.com/callback', // Optional webhook
        input: {
          prompt: prompt,
          size: size // Options: '1:1', '16:9', '9:16', '2:3', '3:2', '3:4', '4:3'
        }
      },
      {
        headers: {
          'Authorization': `Bearer YOUR_API_KEY`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Task ID:', response.data.task_id);
    console.log('Status:', response.data.status);
    console.log('Created:', response.data.created_time);
    return response.data;
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
        "model": "nano-banana-2",
        "callback_url": "https://your-domain.com/callback",  # Optional webhook
        "input": {
            "prompt": prompt,
            "size": size  # Options: '1:1', '16:9', '9:16', '2:3', '3:2', '3:4', '4:3'
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
        print(f"Task ID: {result['task_id']}")
        print(f"Status: {result['status']}")
        print(f"Created: {result['created_time']}")
        return result

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
    "model": "nano-banana-2",
    "callback_url": "https://your-domain.com/callback",
    "input": {
      "prompt": "A professional headshot of a confident business woman in modern office setting",
      "size": "1:1"
    }
  }'
```

## Advanced Features of Nano Banana 2

### 1. Cultural Context Awareness

Nano Banana 2's cultural understanding allows for authentic regional content:

```javascript
const culturalPrompts = [
  "Tokyo springtime cherry blossom picnic with families in traditional dress",
  "Berlin winter street fashion with authentic German architecture",
  "Mumbai monsoon street food vendor with vibrant local atmosphere"
];

// Generate culturally accurate images
culturalPrompts.forEach(async (prompt) => {
  const result = await generateImage(prompt);
  console.log(`Generated culturally aware image for: ${prompt}`);
});
```

### 2. Perfect Text Rendering

Generate images with mathematical equations and complex text:

```python
def generate_educational_content(equation, api_key):
    prompt = f"A clean whiteboard with the mathematical equation '{equation}' written in clear handwriting, classroom setting"

    payload = {
        "model": "nano-banana-2",
        "prompt": prompt,
        "width": 1024,
        "height": 768,
        "guidance_scale": 8.0,
        "num_inference_steps": 60
    }

    return generate_image_with_payload(payload, api_key)

# Generate educational content with perfect text
result = generate_educational_content("E = mc²", "YOUR_API_KEY")
```

### 3. Multiple Aspect Ratios

Nano Banana 2 supports various aspect ratios for different use cases:

```javascript
const aspectRatios = {
  square: { width: 1024, height: 1024 },      // 1:1 - Social media
  portrait: { width: 768, height: 1024 },     // 3:4 - Mobile screens
  landscape: { width: 1024, height: 768 },    // 4:3 - Desktop
  widescreen: { width: 1792, height: 1024 },  // 16:9 - Video thumbnails
  ultrawide: { width: 2048, height: 896 }     // 21:9 - Banners
};

const generateWithAspectRatio = async (prompt, ratio) => {
  const dimensions = aspectRatios[ratio];

  const response = await axios.post(
    'https://api.poyo.ai/v1/image/generations',
    {
      model: 'nano-banana-2',
      prompt: prompt,
      ...dimensions,
      guidance_scale: 7.5
    },
    {
      headers: {
        'Authorization': `Bearer YOUR_API_KEY`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
};
```

## Image Editing with Nano Banana 2

### Image-to-Image Transformation

```javascript
const editImage = async (imageUrls, editPrompt, size = '1:1') => {
  try {
    const response = await axios.post(
      'https://api.poyo.ai/api/generate/submit',
      {
        model: 'nano-banana-2-edit',
        callback_url: 'https://your-domain.com/callback', // Optional
        input: {
          prompt: editPrompt,
          image_urls: imageUrls, // Array of reference image URLs
          size: size
        }
      },
      {
        headers: {
          'Authorization': `Bearer YOUR_API_KEY`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error editing image:', error.response?.data || error.message);
  }
};

// Example: Transform day scene to night
const result = await editImage(
  ['https://example.com/day-scene.jpg'],
  'Transform this scene to a beautiful night setting with stars and moon',
  '16:9'
);
```

## Handling Results with Webhooks

Nano Banana 2 API uses webhooks for result delivery. Set up a webhook endpoint to receive results:

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

If you prefer not to use webhooks, you can check task status manually:

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

    return response.data.data; // Returns the task data
  } catch (error) {
    console.error('Error checking status:', error.message);
    return null;
  }
};

const pollForResult = async (taskId, maxAttempts = 30) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const taskData = await checkTaskStatus(taskId);

    if (!taskData) break;

    console.log(`Status: ${taskData.status}, Progress: ${taskData.progress}%`);

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

    // Status is 'not_started' or 'running'
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
  }

  console.error('Maximum polling attempts reached');
  return null;
};

// Complete workflow example
const completeGeneration = async (prompt) => {
  // Step 1: Submit generation request
  const generation = await generateImage(prompt);

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

        print(f"Status: {task_data['status']}, Progress: {task_data.get('progress', 0)}%")

        if task_data['status'] == 'finished':
            print("Image generated successfully!")
            if task_data.get('files') and len(task_data['files']) > 0:
                print(f"Image URL: {task_data['files'][0]['file_url']}")
            return task_data
        elif task_data['status'] == 'failed':
            print(f"Generation failed: {task_data.get('error_message', 'Unknown error')}")
            return None

        time.sleep(3)  # Wait 3 seconds

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
          model: 'nano-banana-2',
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

      return response.data;

    } catch (error) {
      if (error.response) {
        // Server responded with error status
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

### Best Practices for Production

1. **Rate Limiting**: Implement proper rate limiting to avoid hitting API limits
2. **Caching**: Cache successful generations to reduce API calls
3. **User Experience**: Show progress indicators for long-running generations
4. **Error Recovery**: Implement graceful fallbacks for failed generations

```javascript
class NanoBanana2Client {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.poyo.ai/v1';
    this.requestsPerMinute = options.requestsPerMinute || 60;
    this.queue = [];
  }

  async generateImage(prompt, options = {}) {
    const payload = {
      model: 'nano-banana-2',
      prompt,
      width: options.width || 1024,
      height: options.height || 1024,
      guidance_scale: options.guidanceScale || 7.5,
      num_inference_steps: options.steps || 50
    };

    return this.makeRequest('/image/generations', payload);
  }

  async editImage(imageUrl, editPrompt, options = {}) {
    const payload = {
      model: 'nano-banana-2-edit',
      image: imageUrl,
      prompt: editPrompt,
      strength: options.strength || 0.8,
      guidance_scale: options.guidanceScale || 7.5
    };

    return this.makeRequest('/image/edits', payload);
  }

  async makeRequest(endpoint, payload) {
    // Implement rate limiting, error handling, and retries
    // This is a simplified version

    try {
      const response = await axios.post(
        `${this.baseURL}${endpoint}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    // Implement comprehensive error handling
    return new Error(`Nano Banana 2 API Error: ${error.message}`);
  }
}
```

## Performance Optimization Tips

### 1. Prompt Engineering
- **Be specific**: Detailed prompts yield better results
- **Include style directives**: "photorealistic", "4K resolution", "professional"
- **Use cultural context**: Leverage Nano Banana 2's cultural awareness

### 2. Parameter Tuning
- **guidance_scale**: 7.0-8.5 for most use cases
- **num_inference_steps**: 30-60 (higher for better quality)
- **strength**: 0.6-0.9 for image editing (lower preserves more original)

### 3. Batch Processing
```javascript
const generateBatch = async (prompts) => {
  const generations = await Promise.all(
    prompts.map(prompt => generateImage(prompt))
  );

  const results = await Promise.all(
    generations.map(gen => pollForResult(gen.id))
  );

  return results.filter(result => result !== null);
};
```

## Conclusion

Nano Banana 2 API on PoYo provides unprecedented capabilities for AI image generation with its revolutionary 5-step workflow, cultural context awareness, and perfect text rendering. By following this guide, you can integrate these powerful features into your applications and create professional-grade visual content.

For more advanced features and complete API documentation, visit the [official Nano Banana 2 API documentation](https://docs.poyo.ai/api-manual/image-series/nano-banana-2).

Ready to start building? [Get your API key](https://poyo.ai/dashboard/api-key) and begin creating with Nano Banana 2 today.

---

*Need help with implementation? Join our [developer community](https://poyo.ai/support) or check out more [API tutorials](https://poyo.ai/hub) for advanced techniques.*
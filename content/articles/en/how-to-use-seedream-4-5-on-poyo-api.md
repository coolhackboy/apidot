---
title: "How to Use Seedream 4.5 API on PoYo: Complete Developer Guide"
category: "tutorials"
description: "Learn how to integrate Seedream 4.5 API powered by ByteDance's ultra 4K technology into your applications. Step-by-step guide with code examples for professional-grade image generation."
locale: "en"
image: "https://cdn.doculator.org/seedream-4-5-api/example-output.jpg"
author: "Poyo.ai Team"
datePublished: "2025-12-03T13:38:00.000Z"
dateModified: "2025-12-03T13:38:00.000Z"
tags: "seedream 4.5, api tutorial, image generation, bytedance, developer guide, 4k images"
popular: true
---

![How to Use Seedream 4.5 API on PoYo](https://cdn.doculator.org/seedream-4-5-api/example-output.jpg)

Seedream 4.5 API, powered by ByteDance's latest ultra 4K image generation technology, delivers revolutionary capabilities for professional-grade visual content creation. This comprehensive guide will walk you through implementing advanced lighting logic, professional text precision, and commercial photography quality using PoYo's API.

## Seedream 4.5 Model Overview

Seedream 4.5 is a cutting-edge AI image generation model developed by ByteDance, offering ultra 4K resolution capabilities with professional-grade output quality. Available exclusively on PoYo.ai, this model excels in:

- **Ultra 4K Resolution**: Generate crisp, detailed images up to 4096x4096 pixels
- **Professional Text Precision**: Advanced text rendering with perfect typography
- **Intelligent Lighting Logic**: Sophisticated lighting and shadow calculations
- **Commercial Photography Quality**: Studio-grade composition and color accuracy
- **Multiple Aspect Ratios**: Support for 1:1, 4:3, 3:4, 16:9, 9:16, 3:2, 2:3, 21:9

### Model Details Page

Visit the [Seedream 4.5 API model page](https://poyo.ai/models/seedream-4-5-api) to:
- **Interactive Playground**: Test the API directly in your browser
- **Live Examples**: View sample generations and prompts
- **API Documentation**: Comprehensive parameter references
- **Pricing Information**: Current rates (10 credits = $0.05 per image)
- **Performance Benchmarks**: Speed and quality comparisons

## Getting Started with Seedream 4.5 API

### Step 1: Set Up Your PoYo Account

First, create your PoYo account and obtain your API credentials:

1. **Sign up** at [PoYo.ai](https://poyo.ai)
2. **Generate your API key** in the [dashboard](https://poyo.ai/dashboard/api-key)
3. **Add credits** to your account (Seedream 4.5 costs 10 credits per generation)
4. **Explore the model** on the [Seedream 4.5 details page](https://poyo.ai/models/seedream-4-5-api)

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

const generateImage = async (prompt, size = '16:9') => {
  try {
    const response = await axios.post(
      'https://api.poyo.ai/api/generate/submit',
      {
        model: 'seedream-4.5',
        callback_url: 'https://your-domain.com/callback', // Optional webhook
        input: {
          prompt: prompt,
          size: size, // Options: '1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', '21:9'
          n: 1
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
    console.log('Created:', response.data.data.created_time);
    return response.data.data;
  } catch (error) {
    console.error('Error generating image:', error.response?.data || error.message);
  }
};

// Example usage with professional photography prompt
generateImage('Professional commercial product photography of luxury watch with cinematic lighting and golden ratio composition', '16:9');
```

### Python Implementation

```python
import requests
import json

def generate_image(prompt, api_key, size='16:9'):
    url = "https://api.poyo.ai/api/generate/submit"

    payload = {
        "model": "seedream-4.5",
        "callback_url": "https://your-domain.com/callback",  # Optional webhook
        "input": {
            "prompt": prompt,
            "size": size,  # Options: '1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', '21:9'
            "n": 1
        }
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()

        result = response.json()['data']
        print(f"Task ID: {result['task_id']}")
        print(f"Created: {result['created_time']}")
        return result

    except requests.exceptions.RequestException as e:
        print(f"Error generating image: {e}")
        return None

# Example usage with ultra 4K quality
api_key = "YOUR_API_KEY"
result = generate_image("Ultra high-quality 4K commercial photography of modern architecture with perfect lighting", api_key, '21:9')
```

### cURL Implementation

```bash
curl -X POST "https://api.poyo.ai/api/generate/submit" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedream-4.5",
    "callback_url": "https://your-domain.com/callback",
    "input": {
      "prompt": "Professional e-commerce product photography with cinematic color grading and natural proportions",
      "size": "4:3",
      "n": 1
    }
  }'
```

## Advanced Features of Seedream 4.5

### 1. Professional Text Precision

Seedream 4.5 excels at rendering sharp text and typography with commercial-grade accuracy:

```javascript
const generateTextRichImages = async () => {
  const textPrompts = [
    "Professional corporate signage with 'PoYo API' text in modern sans-serif font",
    "Technical diagram with precise mathematical equations and clear labels",
    "Branded marketing poster with sharp typography and commercial quality text"
  ];

  for (const prompt of textPrompts) {
    const result = await generateImage(prompt, '16:9');
    console.log(`Generated professional text image: ${prompt}`);
  }
};

// Generate images with perfect text rendering
generateTextRichImages();
```

### 2. Advanced Lighting Logic

Utilize Seedream 4.5's revolutionary lighting engine for commercial photography quality:

```python
def generate_commercial_photography(product_name, api_key):
    prompt = f"Professional commercial photography of {product_name} with cinematic color grading, realistic lighting, natural proportions, and strong 3D depth for e-commerce catalog"

    payload = {
        "model": "seedream-4.5",
        "input": {
            "prompt": prompt,
            "size": "1:1",  # Perfect for e-commerce
            "n": 1
        }
    }

    return generate_image_with_payload(payload, api_key)

# Generate commercial-quality product photos
products = ["luxury skincare bottle", "premium headphones", "artisan coffee package"]
for product in products:
    result = generate_commercial_photography(product, "YOUR_API_KEY")
```

### 3. Enhanced Composition Reasoning

Seedream 4.5 understands professional photography terms and composition techniques:

```javascript
const compositionPrompts = [
  "Professional portrait with golden ratio composition and background blur",
  "Landscape photography using rule of thirds with diagonal composition",
  "Commercial product shot with dramatic lighting and cinematic framing",
  "Architectural photography with leading lines and symmetrical balance"
];

const generateWithComposition = async (prompt, technique) => {
  const enhancedPrompt = `${prompt}, ${technique}, ultra 4K resolution, professional photography quality`;

  const response = await axios.post(
    'https://api.poyo.ai/api/generate/submit',
    {
      model: 'seedream-4.5',
      input: {
        prompt: enhancedPrompt,
        size: '16:9',
        n: 1
      }
    },
    {
      headers: {
        'Authorization': `Bearer YOUR_API_KEY`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.data;
};
```

### 4. Ultra 4K Resolution Output

Generate high-resolution images suitable for commercial use:

```python
def generate_4k_content(description, api_key, aspect_ratio='16:9'):
    prompt = f"Ultra high-resolution 4K quality {description}, professional commercial photography standards, enhanced visual refinement, print-ready quality"

    payload = {
        "model": "seedream-4.5",
        "input": {
            "prompt": prompt,
            "size": aspect_ratio,
            "n": 1
        }
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    response = requests.post("https://api.poyo.ai/api/generate/submit", json=payload, headers=headers)
    return response.json()['data']

# Generate 4K quality images for different use cases
use_cases = [
    ("billboard advertisement design", "21:9"),
    ("magazine cover photography", "3:4"),
    ("desktop wallpaper", "16:9"),
    ("social media post", "1:1")
]

for description, size in use_cases:
    result = generate_4k_content(description, "YOUR_API_KEY", size)
    print(f"Generated 4K {description} in {size} format")
```

## Image Editing with Seedream 4.5

### Image-to-Image Transformation

```javascript
const editImage = async (imageUrls, editPrompt, size = '16:9') => {
  try {
    const response = await axios.post(
      'https://api.poyo.ai/api/generate/submit',
      {
        model: 'seedream-4.5-edit',
        callback_url: 'https://your-domain.com/callback', // Optional
        input: {
          prompt: editPrompt,
          image_urls: imageUrls, // Array of reference image URLs (max 5)
          size: size,
          n: 1
        }
      },
      {
        headers: {
          'Authorization': `Bearer YOUR_API_KEY`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error editing image:', error.response?.data || error.message);
  }
};

// Example: Enhance product photography with professional lighting
const result = await editImage(
  ['https://example.com/product-photo.jpg'],
  'Enhanced commercial photography with professional studio lighting, cinematic color grading, and ultra 4K quality',
  '1:1'
);
```

## Checking Generation Status

### Manual Status Checking

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

    console.log(`Status: ${taskData.status}`);

    if (taskData.status === 'finished') {
      console.log('Ultra 4K image generated successfully!');
      if (taskData.files && taskData.files.length > 0) {
        console.log('Image URL:', taskData.files[0].file_url);
        console.log('File type:', taskData.files[0].file_type);
      }
      return taskData;
    } else if (taskData.status === 'failed') {
      console.error('Generation failed:', taskData.error_message);
      return null;
    }

    // Status is 'processing'
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
  }

  console.error('Maximum polling attempts reached');
  return null;
};

// Complete workflow example
const completeGeneration = async (prompt, size = '16:9') => {
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
            print("Ultra 4K image generated successfully!")
            if task_data.get('files') and len(task_data['files']) > 0:
                print(f"Image URL: {task_data['files'][0]['file_url']}")
                print(f"File type: {task_data['files'][0]['file_type']}")
            return task_data
        elif task_data['status'] == 'failed':
            print(f"Generation failed: {task_data.get('error_message', 'Unknown error')}")
            return None

        time.sleep(3)  # Wait 3 seconds

    print("Maximum attempts reached")
    return None

# Complete workflow
def complete_image_generation(prompt, api_key, size='16:9'):
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
const robustImageGeneration = async (prompt, size = '16:9', retries = 3) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.post(
        'https://api.poyo.ai/api/generate/submit',
        {
          model: 'seedream-4.5',
          input: {
            prompt: prompt,
            size: size,
            n: 1
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
        // Server responded with error status
        const status = error.response.status;
        const message = error.response.data?.message || 'Unknown error';

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

## Commercial Use Cases

### E-commerce Product Photography

```javascript
const generateProductPhotos = async (productName, variations = []) => {
  const basePrompt = `Professional e-commerce product photography of ${productName}`;

  const scenarios = [
    'with clean white background and studio lighting',
    'with lifestyle setting and natural lighting',
    'with dramatic shadows and commercial quality',
    'with 360-degree view perspective'
  ];

  const results = [];

  for (const scenario of scenarios) {
    const fullPrompt = `${basePrompt} ${scenario}, ultra 4K resolution, commercial photography standards`;

    try {
      const generation = await generateImage(fullPrompt, '1:1');
      const result = await pollForResult(generation.task_id);

      if (result) {
        results.push({
          scenario: scenario,
          imageUrl: result.files[0].file_url,
          taskId: result.task_id
        });
      }
    } catch (error) {
      console.error(`Failed to generate ${scenario}:`, error.message);
    }
  }

  return results;
};

// Generate product photos for e-commerce
const productPhotos = await generateProductPhotos('luxury smartphone');
```

### Marketing and Advertising

```python
def generate_marketing_assets(campaign_theme, brand_colors="", sizes=['1:1', '16:9', '9:16']):
    assets = []

    for size in sizes:
        # Determine format based on size
        format_type = {
            '1:1': 'social media post',
            '16:9': 'banner advertisement',
            '9:16': 'mobile story format',
            '21:9': 'wide banner',
            '4:3': 'display advertisement'
        }.get(size, 'general format')

        prompt = f"Professional {format_type} design for {campaign_theme}, {brand_colors}, cinematic quality, commercial photography standards, ultra 4K resolution"

        try:
            result = generate_image(prompt, "YOUR_API_KEY", size)
            if result:
                final_result = wait_for_completion(result['task_id'], "YOUR_API_KEY")
                if final_result:
                    assets.append({
                        'format': format_type,
                        'size': size,
                        'image_url': final_result['files'][0]['file_url'],
                        'task_id': final_result['task_id']
                    })
        except Exception as e:
            print(f"Failed to generate {format_type}: {e}")

    return assets

# Generate complete marketing campaign assets
campaign_assets = generate_marketing_assets(
    "luxury travel experience campaign",
    "gold and deep blue color scheme",
    ['1:1', '16:9', '9:16', '21:9']
)
```

## Performance Optimization Tips

### 1. Prompt Engineering for Seedream 4.5

- **Use professional terminology**: "commercial photography", "cinematic lighting", "ultra 4K"
- **Specify composition**: "golden ratio", "rule of thirds", "diagonal composition"
- **Include quality directives**: "professional grade", "commercial standards", "print-ready"
- **Leverage advanced features**: "enhanced visual refinement", "advanced lighting logic"

```javascript
// Optimized prompt structure
const buildOptimizedPrompt = (subject, style, quality, composition) => {
  return `${subject}, ${style}, ${quality}, ${composition}, ultra 4K resolution, commercial photography standards, enhanced visual refinement`;
};

// Examples
const prompts = [
  buildOptimizedPrompt(
    "luxury watch product photography",
    "professional studio lighting with cinematic color grading",
    "commercial grade quality",
    "golden ratio composition with background blur"
  ),
  buildOptimizedPrompt(
    "modern architecture visualization",
    "dramatic natural lighting with realistic shadows",
    "print-ready 4K quality",
    "diagonal composition with leading lines"
  )
];
```

### 2. Aspect Ratio Selection

Choose the optimal aspect ratio for your use case:

```javascript
const aspectRatioGuide = {
  '1:1': 'Social media posts, profile pictures, product shots',
  '4:3': 'Traditional displays, presentations, desktop wallpapers',
  '3:4': 'Mobile screens, portrait photography, book covers',
  '16:9': 'Video thumbnails, wide banners, landscape photography',
  '9:16': 'Mobile stories, vertical videos, smartphone wallpapers',
  '3:2': 'Classic photography, print media, photo frames',
  '2:3': 'Portrait prints, magazine covers, book layouts',
  '21:9': 'Ultra-wide banners, cinema displays, panoramic shots'
};

const selectOptimalRatio = (useCase) => {
  const ratioMap = {
    'social_media': '1:1',
    'youtube_thumbnail': '16:9',
    'instagram_story': '9:16',
    'website_banner': '21:9',
    'product_catalog': '1:1',
    'magazine_cover': '2:3',
    'landscape_photo': '3:2'
  };

  return ratioMap[useCase] || '16:9';
};
```

### 3. Batch Processing for Commercial Workflows

```javascript
class Seedream45Client {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.poyo.ai';
    this.concurrentRequests = options.concurrentRequests || 5;
  }

  async generateImageBatch(prompts, options = {}) {
    const { size = '16:9', maxRetries = 3 } = options;

    // Process in batches to avoid overwhelming the API
    const batches = this.chunkArray(prompts, this.concurrentRequests);
    const allResults = [];

    for (const batch of batches) {
      const batchPromises = batch.map(prompt =>
        this.generateSingleImage(prompt, size, maxRetries)
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        allResults.push(...batchResults.filter(result => result !== null));
      } catch (error) {
        console.error('Batch processing error:', error);
      }

      // Wait between batches to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return allResults;
  }

  async generateSingleImage(prompt, size, maxRetries) {
    try {
      const generation = await this.submitGeneration(prompt, size);
      if (!generation) return null;

      const result = await this.waitForCompletion(generation.task_id);
      return result;
    } catch (error) {
      console.error(`Failed to generate image for prompt: ${prompt.substring(0, 50)}...`, error);
      return null;
    }
  }

  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Usage example
const client = new Seedream45Client('YOUR_API_KEY', { concurrentRequests: 3 });

const commercialPrompts = [
  'Professional luxury car photography with cinematic lighting',
  'High-end fashion photography with commercial quality',
  'Premium food photography with perfect composition',
  'Corporate headshot with professional studio lighting'
];

const results = await client.generateImageBatch(commercialPrompts, {
  size: '4:3',
  maxRetries: 2
});
```

## Production Deployment Considerations

### 1. API Key Management

```javascript
// Environment-based configuration
const config = {
  apiKey: process.env.POYO_API_KEY,
  baseURL: process.env.POYO_API_URL || 'https://api.poyo.ai',
  timeout: parseInt(process.env.API_TIMEOUT) || 30000,
  retries: parseInt(process.env.API_RETRIES) || 3
};

// Validate configuration
if (!config.apiKey) {
  throw new Error('POYO_API_KEY environment variable is required');
}
```

### 2. Monitoring and Logging

```python
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Seedream45Monitor:
    def __init__(self):
        self.generation_stats = {
            'total_requests': 0,
            'successful_generations': 0,
            'failed_generations': 0,
            'total_credits_used': 0
        }

    def log_generation_request(self, prompt, size, task_id):
        logger.info(f"Generation request submitted - Task: {task_id}, Size: {size}, Prompt: {prompt[:50]}...")
        self.generation_stats['total_requests'] += 1

    def log_generation_success(self, task_id, image_url):
        logger.info(f"Generation completed successfully - Task: {task_id}, URL: {image_url}")
        self.generation_stats['successful_generations'] += 1
        self.generation_stats['total_credits_used'] += 10  # Seedream 4.5 costs 10 credits

    def log_generation_failure(self, task_id, error_message):
        logger.error(f"Generation failed - Task: {task_id}, Error: {error_message}")
        self.generation_stats['failed_generations'] += 1

    def get_stats(self):
        success_rate = (self.generation_stats['successful_generations'] /
                       max(self.generation_stats['total_requests'], 1)) * 100

        return {
            **self.generation_stats,
            'success_rate': f"{success_rate:.2f}%",
            'average_cost': self.generation_stats['total_credits_used'] /
                          max(self.generation_stats['successful_generations'], 1)
        }

# Usage
monitor = Seedream45Monitor()

def generate_with_monitoring(prompt, api_key, size='16:9'):
    try:
        # Submit generation
        result = generate_image(prompt, api_key, size)
        if result:
            monitor.log_generation_request(prompt, size, result['task_id'])

            # Wait for completion
            final_result = wait_for_completion(result['task_id'], api_key)

            if final_result and final_result.get('files'):
                monitor.log_generation_success(
                    result['task_id'],
                    final_result['files'][0]['file_url']
                )
                return final_result
            else:
                monitor.log_generation_failure(result['task_id'], "No files in result")
                return None

    except Exception as e:
        monitor.log_generation_failure("unknown", str(e))
        return None

# Generate stats report
stats = monitor.get_stats()
print(f"Generation Statistics: {stats}")
```

## Conclusion

Seedream 4.5 API on PoYo delivers unprecedented ultra 4K quality with professional text precision, advanced lighting logic, and commercial photography standards. By following this guide, you can integrate these powerful capabilities into your applications and create professional-grade visual content suitable for e-commerce, advertising, and commercial use.

The combination of ByteDance's revolutionary technology with PoYo's reliable infrastructure ensures consistent, high-quality results for your production workflows.

For more advanced features and complete API documentation, visit the [official Seedream 4.5 API documentation](https://docs.poyo.ai/api-manual/image-series/seedream-4-5).

Ready to start building with ultra 4K quality? [Get your API key](https://poyo.ai/dashboard/api-key) and begin creating with Seedream 4.5 today.

---

*Need help with implementation? Join our [developer community](https://poyo.ai/support) or check out more [API tutorials](https://poyo.ai/hub) for advanced techniques.*

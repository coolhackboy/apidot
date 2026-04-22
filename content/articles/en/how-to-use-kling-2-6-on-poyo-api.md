---
title: "How to Use Kling 2.6 API on PoYo: Complete Developer Guide"
category: "tutorials"
description: "Learn how to integrate Kling 2.6 API for AI video generation with native audio. Step-by-step guide with code examples for text-to-video and image-to-video generation."
locale: "en"
image: "https://storage.poyo.ai/uplaod/misplv2r_2n263eq31fv.webp"
author: "Poyo.ai Team"
datePublished: "2025-12-05T12:00:00.000Z"
dateModified: "2025-12-05T12:00:00.000Z"
tags: "kling 2.6, api tutorial, video generation, native audio, developer guide"
popular: true
---

![How to Use Kling 2.6 API on PoYo](https://storage.poyo.ai/uplaod/misplv2r_2n263eq31fv.webp)

Kling 2.6 API is a revolutionary AI video generation model that produces videos with synchronized native audio - including speech, singing, and sound effects. This comprehensive guide will walk you through integrating Kling 2.6's powerful capabilities into your applications.

## Getting Started with Kling 2.6 API

### Step 1: Set Up Your PoYo Account

First, create your PoYo account and obtain your API credentials:

1. **Sign up** at [PoYo.ai](https://poyo.ai)
2. **Generate your API key** in the [dashboard](https://poyo.ai/dashboard/api-key)
3. **Add credits** to your account (Kling 2.6 pricing varies by duration and audio)

### Step 2: Install Required Dependencies

```bash
# For Node.js/JavaScript
npm install axios

# For Python
pip install requests

# For cURL (no installation needed)
```

## Basic Text-to-Video Generation

### JavaScript/Node.js Implementation

```javascript
const axios = require('axios');

const generateVideo = async (prompt, options = {}) => {
  const {
    duration = 5,       // 5 or 10 seconds
    aspectRatio = '16:9', // '1:1', '16:9', or '9:16'
    sound = true        // Enable native audio
  } = options;

  try {
    const response = await axios.post(
      'https://api.poyo.ai/api/generate/submit',
      {
        model: 'kling-2.6',
        callback_url: 'https://your-domain.com/callback', // Optional webhook
        input: {
          prompt: prompt,
          sound: sound,
          aspect_ratio: aspectRatio,
          duration: duration
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
    console.error('Error generating video:', error.response?.data || error.message);
  }
};

// Example: Generate a video with speech
generateVideo(
  'A man in a coffee shop looking at his laptop, smiling. He says "This AI is incredible!" in an excited voice.',
  { duration: 5, aspectRatio: '16:9', sound: true }
);
```

### Python Implementation

```python
import requests
import json

def generate_video(prompt, api_key, duration=5, aspect_ratio='16:9', sound=True):
    url = "https://api.poyo.ai/api/generate/submit"

    payload = {
        "model": "kling-2.6",
        "callback_url": "https://your-domain.com/callback",  # Optional
        "input": {
            "prompt": prompt,
            "sound": sound,
            "aspect_ratio": aspect_ratio,
            "duration": duration
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
        print(f"Error generating video: {e}")
        return None

# Example usage
api_key = "YOUR_API_KEY"
result = generate_video(
    "A chef in a kitchen demonstrating how to chop vegetables. He narrates: 'First, we cut the onion in half.'",
    api_key,
    duration=10,
    aspect_ratio='16:9',
    sound=True
)
```

### cURL Implementation

```bash
curl -X POST "https://api.poyo.ai/api/generate/submit" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kling-2.6",
    "callback_url": "https://your-domain.com/callback",
    "input": {
      "prompt": "A woman sitting at a piano, playing a gentle melody. She sings softly: Welcome to my world of music.",
      "sound": true,
      "aspect_ratio": "16:9",
      "duration": 10
    }
  }'
```

## API Parameters

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model` | string | Yes | Must be `"kling-2.6"` |
| `callback_url` | string | No | Webhook URL for async notifications |
| `input.prompt` | string | Yes | Text description (max 1000 characters) |
| `input.sound` | boolean | Yes | Enable native audio generation |
| `input.aspect_ratio` | string | Yes | `"1:1"`, `"16:9"`, or `"9:16"` |
| `input.duration` | integer | Yes | `5` or `10` seconds |
| `input.image_urls` | array | No | Reference images for image-to-video |

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

## Image-to-Video Generation

Transform static images into dynamic videos with Kling 2.6:

```javascript
const generateVideoFromImage = async (imageUrl, prompt, options = {}) => {
  const {
    duration = 5,
    aspectRatio = '16:9',
    sound = true
  } = options;

  try {
    const response = await axios.post(
      'https://api.poyo.ai/api/generate/submit',
      {
        model: 'kling-2.6',
        callback_url: 'https://your-domain.com/callback',
        input: {
          prompt: prompt,
          sound: sound,
          aspect_ratio: aspectRatio,
          duration: duration,
          image_urls: [imageUrl] // Reference image
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
    console.error('Error generating video:', error.response?.data || error.message);
  }
};

// Example: Animate a portrait photo
const result = await generateVideoFromImage(
  'https://example.com/portrait.jpg',
  'The person in the photo turns to smile at the camera and waves hello.',
  { duration: 5, sound: true }
);
```

### Python Image-to-Video

```python
def generate_video_from_image(image_url, prompt, api_key, duration=5, aspect_ratio='16:9', sound=True):
    url = "https://api.poyo.ai/api/generate/submit"

    payload = {
        "model": "kling-2.6",
        "callback_url": "https://your-domain.com/callback",
        "input": {
            "prompt": prompt,
            "sound": sound,
            "aspect_ratio": aspect_ratio,
            "duration": duration,
            "image_urls": [image_url]
        }
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()['data']
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

# Example: Animate a product image
result = generate_video_from_image(
    "https://example.com/product.jpg",
    "The product rotates slowly, showcasing all angles. A voice says: Introducing our latest innovation.",
    api_key,
    duration=10,
    sound=True
)
```

## Native Audio Feature

The `sound` parameter enables Kling 2.6's native audio generation:

### Writing Prompts with Audio

When `sound: true`, include audio cues in your prompt:

```javascript
// Prompt with speech
const speechPrompt = `
  A news anchor at a desk looks into the camera.
  He says: "Breaking news tonight, scientists have made an incredible discovery."
  The anchor gestures with his hands while speaking.
`;

// Prompt with sound effects
const sfxPrompt = `
  A cat walks across a wooden floor, meowing softly.
  Birds chirp outside the window.
  The cat jumps onto a couch with a soft thud.
`;

// Prompt with singing
const musicPrompt = `
  A woman with a guitar sits on a beach at sunset.
  She strums gently and sings a soft melody about the ocean.
  Waves crash softly in the background.
`;

// Prompt with multilingual speech
const multilingualPrompt = `
  Scene: Open office with printer sounds in background.
  [Male worker] asks: "报告快好了吗？Manager needs it this afternoon."
  [Female worker] replies: "Almost done. I'll send it in ten minutes."
`;
```

### Audio vs Silent Videos

```javascript
// Generate with audio (120 credits for 5s)
const withAudio = await generateVideo(
  'A barista making coffee, explaining each step of the process.',
  { duration: 5, sound: true }
);

// Generate without audio (65 credits for 5s)
const silent = await generateVideo(
  'A timelapse of clouds moving across a mountain landscape.',
  { duration: 5, sound: false }
);
```

## Handling Results

### Webhook Handler

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook/callback', async (req, res) => {
  const { task_id, status, files, error_message } = req.body;

  console.log(`Task ${task_id}: ${status}`);

  if (status === 'finished' && files && files.length > 0) {
    const videoFile = files.find(f => f.file_type === 'video');
    if (videoFile) {
      console.log('Video URL:', videoFile.file_url);
      await processCompletedVideo(task_id, videoFile.file_url);
    }
  } else if (status === 'failed') {
    console.error('Generation failed:', error_message);
    await handleVideoError(task_id, error_message);
  }

  res.status(200).send('OK');
});

app.listen(3000);
```

### Manual Status Polling

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

const waitForVideo = async (taskId, maxAttempts = 120) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const taskData = await checkTaskStatus(taskId);

    if (!taskData) break;

    console.log(`Status: ${taskData.status}, Progress: ${taskData.progress || 0}%`);

    if (taskData.status === 'finished') {
      console.log('Video generated successfully!');
      const videoFile = taskData.files?.find(f => f.file_type === 'video');
      if (videoFile) {
        console.log('Video URL:', videoFile.file_url);
      }
      return taskData;
    } else if (taskData.status === 'failed') {
      console.error('Generation failed:', taskData.error_message);
      return null;
    }

    // Wait 5 seconds between checks (video generation takes time)
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.error('Timeout waiting for video');
  return null;
};

// Complete workflow
const createVideo = async (prompt, options = {}) => {
  const generation = await generateVideo(prompt, options);
  if (!generation) return null;

  const result = await waitForVideo(generation.task_id);
  return result;
};
```

### Python Status Polling

```python
import time

def check_task_status(task_id, api_key):
    url = f"https://api.poyo.ai/api/generate/status/{task_id}"
    headers = {"Authorization": f"Bearer {api_key}"}

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()['data']
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

def wait_for_video(task_id, api_key, max_attempts=120):
    for attempt in range(max_attempts):
        task_data = check_task_status(task_id, api_key)

        if not task_data:
            break

        print(f"Status: {task_data['status']}, Progress: {task_data.get('progress', 0)}%")

        if task_data['status'] == 'finished':
            print("Video generated successfully!")
            video_file = next(
                (f for f in task_data.get('files', []) if f['file_type'] == 'video'),
                None
            )
            if video_file:
                print(f"Video URL: {video_file['file_url']}")
            return task_data
        elif task_data['status'] == 'failed':
            print(f"Failed: {task_data.get('error_message')}")
            return None

        time.sleep(5)  # Wait 5 seconds

    print("Timeout")
    return None

# Complete workflow
def create_video(prompt, api_key, **options):
    generation = generate_video(prompt, api_key, **options)
    if not generation:
        return None
    return wait_for_video(generation['task_id'], api_key)
```

## Error Handling

```javascript
const robustVideoGeneration = async (prompt, options = {}, retries = 3) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.post(
        'https://api.poyo.ai/api/generate/submit',
        {
          model: 'kling-2.6',
          input: {
            prompt,
            sound: options.sound ?? true,
            aspect_ratio: options.aspectRatio ?? '16:9',
            duration: options.duration ?? 5
          }
        },
        {
          headers: {
            'Authorization': `Bearer YOUR_API_KEY`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.data;

    } catch (error) {
      if (error.response) {
        const status = error.response.status;

        if (status === 401 || status === 403) {
          throw new Error('Authentication failed');
        }
        if (status === 400) {
          throw new Error(`Invalid request: ${error.response.data?.error}`);
        }
        if (status === 402) {
          throw new Error('Insufficient credits');
        }
      }

      if (attempt === retries - 1) throw error;

      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

## Prompt Engineering Tips

### Effective Video Prompts

```javascript
// Structure: Scene + Characters + Action + Audio cues
const effectivePrompts = [
  // Interview style
  `A business woman in a modern office, facing the camera.
   She speaks confidently: "Our company has grown 200% this year."
   She gestures with her hands while explaining.`,

  // Product demo
  `Close-up of hands opening a smartphone box.
   A voice narrates: "Unboxing the latest flagship device."
   The phone is lifted out, camera pans to show the screen.`,

  // Storytelling
  `A child runs through a sunlit meadow, laughing.
   Birds sing in the background.
   The child stops to pick a flower and smiles at the camera.`,

  // Educational
  `An animated diagram of the solar system.
   A narrator explains: "The Earth takes 365 days to orbit the sun."
   Planets rotate in their orbits.`
];
```

## Conclusion

Kling 2.6 API on PoYo provides groundbreaking AI video generation with native audio capabilities. Generate complete videos with synchronized speech, music, and sound effects in a single API call.

For more details, visit the [official Kling 2.6 API documentation](https://docs.poyo.ai/api-manual/video-series/kling-2-6).

Ready to start? [Get your API key](https://poyo.ai/dashboard/api-key) and create AI videos with native audio today.

---

*Need help? Join our [developer community](https://poyo.ai/support) or explore more [tutorials](https://poyo.ai/hub).*

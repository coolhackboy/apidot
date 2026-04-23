import { apiService } from './api';
import { appConfig } from '@/data/config';

export interface Veo3SubmitRequest {
  model: "veo3.1-fast" | "veo3.1-lite" | "veo3.1-quality"; // Required: model selection
  callback_url?: string;
  prompt: string; // Required
  duration?: 8; // Optional: Fixed at 8 seconds for VEO3
  aspect_ratio?: "16:9" | "9:16"; // Optional: Aspect ratio (supports both landscape and portrait)
  resolution?: "720p" | "1080p" | "4k"; // Optional: Video resolution (default 720p)
  generate_type?: "frame" | "reference"; // Optional: frame (2 images) or reference (3 images)
  image_urls?: string[]; // Optional: For image-to-video generation (max 10MB each, max 3 images)
}

export interface Veo3SubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

export interface Veo3StatusData {
  task_id: string;
  status: 'not_started' | 'running' | 'finished' | 'failed'; // Task status
  files?: Array<{
    file_url: string;
    file_type: string; // "video", "image", "audio"
  }>;
  created_time: string;
  progress?: number; // Progress percentage (0-100)
  error_message?: string | null;
}

export interface Veo3StatusResponse {
  code: number;
  message?: string;
  data?: Veo3StatusData;
}

export const veo3Api = {
  /**
   * Submit a new VEO3 video generation request
   * @param request - Generation parameters
   * @returns Response with task ID
   */
  async submit(request: Veo3SubmitRequest): Promise<Veo3SubmitResponse> {
    // Build request body with input structure
    const input: any = {
      prompt: request.prompt,
    };

    // Add optional parameters
    input.duration = request.duration ?? 8;

    if (request.aspect_ratio) {
      input.aspect_ratio = request.aspect_ratio;
    }

    if (request.resolution) {
      input.resolution = request.resolution;
    }

    if (request.generate_type) {
      input.generate_type = request.generate_type;
    }

    if (request.image_urls && request.image_urls.length > 0) {
      input.image_urls = request.image_urls;
    }

    const requestBody = {
      model: request.model,
      ...(request.callback_url && { callback_url: request.callback_url }),
      input,
    };

    try {
      const response = await apiService.post(
        '/api/generate/submit',
        requestBody,
        appConfig.appName
      );

      if (response.code !== 200 && response.code !== 0) {
        throw new Error(response.message || `API request failed with code ${response.code}`);
      }

      return response;
    } catch (error: any) {
      console.error('VEO3 video generation failed:', error);
      throw error;
    }
  },

  /**
   * Check the status of a video generation task
   * @param taskId - Task ID returned from submit()
   * @returns Current task status and results
   */
  async checkGenerateStatus(taskId: string): Promise<Veo3StatusResponse> {
    try {
      const response = await apiService.get(
        `/api/generate/status/${taskId}`,
        appConfig.appName
      );

      if (response.code !== 200 && response.code !== 0) {
        throw new Error(response.message || `Failed to check task status: ${response.code}`);
      }

      return response;
    } catch (error: any) {
      console.error('Failed to check generation status:', error);
      throw error;
    }
  },
};

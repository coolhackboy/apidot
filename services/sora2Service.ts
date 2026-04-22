import { apiService } from './api';
import { appConfig } from '@/data/config';

export interface Sora2SubmitRequest {
  model: "sora-2" | "sora-2-pro"; // Required: model selection
  prompt: string; // Required
  duration?: 10 | 15 | 25; // Optional: Video duration in seconds (model-dependent)
  aspect_ratio?: "16:9" | "9:16"; // Optional: Aspect ratio
  image_urls?: string[]; // Optional: For image-to-video generation (max 10MB each)
  watermark?: boolean; // Optional: Add Sora watermark (default: false)
}

export interface Sora2SubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

export interface Sora2StatusData {
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

export interface Sora2StatusResponse {
  code: number;
  message?: string;
  data?: Sora2StatusData;
}

export const sora2Api = {
  /**
   * Submit a new Sora-2 video generation request
   * @param request - Generation parameters
   * @returns Response with task ID
   */
  async submit(request: Sora2SubmitRequest): Promise<Sora2SubmitResponse> {
    // Build request body with input structure
    const input: any = {
      prompt: request.prompt,
    };

    // Add optional parameters
    if (request.duration !== undefined) {
      input.duration = request.duration;
    }

    if (request.aspect_ratio) {
      input.aspect_ratio = request.aspect_ratio;
    }

    if (request.image_urls && request.image_urls.length > 0) {
      input.image_urls = request.image_urls;
    }

    if (request.watermark !== undefined) {
      input.watermark = request.watermark;
    }

    const requestBody = {
      model: request.model,
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
      console.error('Sora-2 video generation failed:', error);
      throw error;
    }
  },

  /**
   * Check the status of a video generation task
   * @param taskId - Task ID returned from submit()
   * @returns Current task status and results
   */
  async checkGenerateStatus(taskId: string): Promise<Sora2StatusResponse> {
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

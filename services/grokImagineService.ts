import { apiService } from './api';
import { appConfig } from '@/data/config';

/**
 * Request interface for Grok Imagine generation
 */
export interface GrokImagineSubmitRequest {
  model: "grok-imagine-image" | "grok-imagine";
  callback_url?: string;
  input: {
    prompt: string;
    size?: string; // For grok-imagine-image (2:3, 3:2, 1:1, 16:9, 9:16)
    mode?: "fun" | "normal" | "spicy"; // For grok-imagine
    duration?: 6 | 10; // For grok-imagine video generation
    aspect_ratio?: string; // For grok-imagine text-to-video (2:3, 3:2, 1:1, 16:9, 9:16)
    image_urls?: string[]; // For grok-imagine image-to-video OR grok-imagine-image image editing (array, max 1)
  };
}

/**
 * Response interface for submit request
 */
export interface GrokImagineSubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

/**
 * Response interface for status check
 */
export interface GrokImagineStatusResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    status: string; // "processing", "finished", "failed"
    files?: Array<{
      file_url: string;
      file_type: string; // "image", "video"
    }>;
    created_time: string;
    error_message?: string | null;
  };
}

export const grokImagineService = {
  /**
   * Submit a new Grok Imagine generation request
   * @param request - Generation parameters
   * @returns Response with task ID
   */
  async submit(request: GrokImagineSubmitRequest): Promise<GrokImagineSubmitResponse> {
    try {
      const response = await apiService.post(
        "/api/generate/submit",
        request,
        appConfig.appName
      );

      if (response.code && response.code !== 0 && response.code !== 200) {
        throw new Error(response.message || `API request failed with code ${response.code}`);
      }

      return response;
    } catch (error: any) {
      console.error('Grok Imagine generation failed:', error);
      throw error;
    }
  },

  /**
   * Check the status of a generation task
   * @param taskId - Task ID returned from submit()
   * @returns Current task status and results
   */
  async checkStatus(taskId: string): Promise<GrokImagineStatusResponse> {
    try {
      const response = await apiService.get(
        `/api/generate/status/${taskId}`,
        appConfig.appName
      );

      if (response.code && response.code !== 0 && response.code !== 200) {
        throw new Error(response.message || `Failed to check task status: ${response.code}`);
      }

      return response;
    } catch (error: any) {
      console.error('Failed to check generation status:', error);
      throw error;
    }
  },
};

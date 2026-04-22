import { apiService } from './api';
import { appConfig } from '@/data/config';

/**
 * Request interface for Seedream 4.5 image generation
 */
export interface Seedream45SubmitRequest {
  model: "seedream-4.5" | "seedream-4.5-edit";
  callback_url?: string;
  input: {
    prompt: string;
    size?: string;
    n?: 1; // Fixed at 1
    image_urls?: string[]; // Required for seedream-4.5-edit (max 10)
  };
}

/**
 * Response interface for submit request
 */
export interface Seedream45SubmitResponse {
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
export interface Seedream45StatusResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    status: string; // "processing", "finished", "failed"
    files?: Array<{
      file_url: string;
      file_type: string; // "image", "video", "audio"
    }>;
    created_time: string;
    error_message?: string | null;
  };
}

export const seedream45Service = {
  /**
   * Submit a new Seedream 4.5 (ByteDance Ultra 4K) generation request
   * @param request - Generation parameters
   * @returns Response with task ID
   */
  async submit(request: Seedream45SubmitRequest): Promise<Seedream45SubmitResponse> {
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
      console.error('Seedream 4.5 image generation failed:', error);
      throw error;
    }
  },

  /**
   * Check the status of a generation task
   * @param taskId - Task ID returned from submit()
   * @returns Current task status and results
   */
  async checkStatus(taskId: string): Promise<Seedream45StatusResponse> {
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

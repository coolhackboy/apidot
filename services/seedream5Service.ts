import { apiService } from './api';
import { appConfig } from '@/data/config';

/**
 * Request interface for Seedream 5.0 image generation
 */
export interface Seedream5SubmitRequest {
  model: "seedream-5.0" | "seedream-5.0-edit" | "seedream-5.0-search";
  callback_url?: string;
  input: {
    prompt: string;
    size?: "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "3:2" | "2:3" | "21:9";
    n?: 1; // Fixed at 1
    image_urls?: string[]; // For edit mode (max 14, 10MB each)
    web_search?: boolean; // For search mode
  };
}

/**
 * Response interface for submit request
 */
export interface Seedream5SubmitResponse {
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
export interface Seedream5StatusResponse {
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

export const seedream5Service = {
  /**
   * Submit a new Seedream 5.0 generation request
   * @param request - Generation parameters
   * @returns Response with task ID
   */
  async submit(request: Seedream5SubmitRequest): Promise<Seedream5SubmitResponse> {
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
      console.error('Seedream 5.0 image generation failed:', error);
      throw error;
    }
  },

  /**
   * Check the status of a generation task
   * @param taskId - Task ID returned from submit()
   * @returns Current task status and results
   */
  async checkStatus(taskId: string): Promise<Seedream5StatusResponse> {
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

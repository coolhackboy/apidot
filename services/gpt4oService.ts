import { apiService } from './api';
import { appConfig } from '@/data/config';

/**
 * Request interface for GPT-4O image generation
 */
export interface Gpt4oSubmitRequest {
  model: "gpt-4o-image" | "gpt-4o-image-edit";
  callback_url?: string;
  input: {
    prompt: string;
    size?: "1:1" | "2:3" | "3:2";
    n?: 1 | 2 | 3 | 4;
    image_urls?: string[]; // Required for gpt-4o-image-edit
    mask_url?: string;
  };
}

/**
 * Response interface for submit request
 */
export interface Gpt4oSubmitResponse {
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
export interface Gpt4oStatusResponse {
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

export const gpt4oService = {
  /**
   * Submit a new GPT-4o image generation request
   * @param request - Generation parameters
   * @returns Response with task ID
   */
  async submit(request: Gpt4oSubmitRequest): Promise<Gpt4oSubmitResponse> {
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
      console.error('GPT-4o Image generation failed:', error);
      throw error;
    }
  },

  /**
   * Check the status of a generation task
   * @param taskId - Task ID returned from submit()
   * @returns Current task status and results
   */
  async checkStatus(taskId: string): Promise<Gpt4oStatusResponse> {
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

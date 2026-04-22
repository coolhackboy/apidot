import { apiService } from './api';
import { appConfig } from '@/data/config';

/**
 * Request interface for Seedream 5.0 Lite image generation
 */
export interface Seedream50LiteSubmitRequest {
  model: "seedream-5.0-lite" | "seedream-5.0-lite-edit";
  callback_url?: string;
  input: {
    prompt: string;
    size?: string;
    n?: 1; // Fixed at 1
    image_urls?: string[]; // Up to 10 for edit
  };
}

/**
 * Response interface for submit request
 */
export interface Seedream50LiteSubmitResponse {
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
export interface Seedream50LiteStatusResponse {
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
    progress?: number; // 0 to 100
    error_message?: string | null;
  };
}

export const seedream50LiteService = {
  /**
   * Submit a new Seedream 5.0 Lite generation request
   * @param request - Generation parameters
   * @returns Response with task ID
   */
  async submit(request: Seedream50LiteSubmitRequest): Promise<Seedream50LiteSubmitResponse> {
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
      console.error('Seedream 5.0 Lite image generation failed:', error);
      throw error;
    }
  },

  /**
   * Check the status of a generation task
   * @param taskId - Task ID returned from submit()
   * @returns Current task status and results
   */
  async checkStatus(taskId: string): Promise<Seedream50LiteStatusResponse> {
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
      console.error('Failed to check Seedream 5.0 Lite generation status:', error);
      throw error;
    }
  },
};

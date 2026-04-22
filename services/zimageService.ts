import { apiService } from './api';
import { appConfig } from '@/data/config';

/**
 * Request interface for Z-Image generation
 */
export interface ZImageSubmitRequest {
  model: "z-image";
  input: {
    prompt: string;
    size: "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
  };
}

/**
 * Response interface for submit request
 */
export interface ZImageSubmitResponse {
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
export interface ZImageStatusResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    status: string; // "processing", "finished", "failed"
    files?: Array<{
      file_url: string;
      file_type: string; // "image"
    }>;
    created_time: string;
    error_message?: string | null;
  };
}

export const zimageApi = {
  /**
   * Submit a new Z-Image generation request
   * @param request - Generation parameters
   * @returns Response with task ID
   */
  async submit(request: ZImageSubmitRequest): Promise<ZImageSubmitResponse> {
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
      console.error('Z-Image generation failed:', error);
      throw error;
    }
  },

  /**
   * Check the status of a generation task
   * @param taskId - Task ID returned from submit()
   * @returns Current task status and results
   */
  async checkGenerateStatus(taskId: string): Promise<ZImageStatusResponse> {
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

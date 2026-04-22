import { apiService } from './api';
import { appConfig } from '@/data/config';

/**
 * Request interface for Seedance 1.0 Pro video generation
 */
export interface SeedanceSubmitRequest {
  model: "seedance-1.0-pro";
  callback_url?: string;
  input: {
    prompt: string;
    resolution?: "720p" | "1080p";
    duration?: 5 | 10;
    image_urls: string[]; // Required for image-to-video
  };
}

/**
 * Response interface for submit request
 */
export interface SeedanceSubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

/**
 * Status data interface
 */
export interface SeedanceStatusData {
  task_id: string;
  status: string; // "not_started", "running", "finished", "failed"
  files?: Array<{
    file_url: string;
    file_type: string; // "video"
  }>;
  created_time: string;
  progress?: number;
  error_message?: string | null;
}

/**
 * Response interface for status check
 */
export interface SeedanceStatusResponse {
  code: number;
  message?: string;
  data?: SeedanceStatusData;
}

export const seedanceService = {
  /**
   * Submit a new Seedance 1.0 Pro video generation request
   * @param request - Generation parameters
   * @returns Response with task ID
   */
  async submit(request: SeedanceSubmitRequest): Promise<SeedanceSubmitResponse> {
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
      console.error('Seedance video generation failed:', error);
      throw error;
    }
  },

  /**
   * Check the status of a generation task
   * @param taskId - Task ID returned from submit()
   * @returns Current task status and results
   */
  async checkStatus(taskId: string): Promise<SeedanceStatusResponse> {
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

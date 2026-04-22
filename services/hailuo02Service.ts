import { apiService } from './api';
import { appConfig } from '@/data/config';

/**
 * Request interface for Hailuo 02 video generation
 */
export interface Hailuo02SubmitRequest {
  model: "hailuo-02" | "hailuo-02-pro";
  callback_url?: string;
  input: {
    prompt: string;
    prompt_optimizer?: boolean;
    resolution?: "768P" | "512P";
    duration?: number;
    image_urls?: string[]; // Start frame for image-to-video
    end_image_url?: string; // End frame for image-to-video
  };
}

/**
 * Response interface for submit request
 */
export interface Hailuo02SubmitResponse {
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
export interface Hailuo02StatusData {
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
export interface Hailuo02StatusResponse {
  code: number;
  message?: string;
  data?: Hailuo02StatusData;
}

export const hailuo02Service = {
  /**
   * Submit a new Hailuo 02 video generation request
   * @param request - Generation parameters
   * @returns Response with task ID
   */
  async submit(request: Hailuo02SubmitRequest): Promise<Hailuo02SubmitResponse> {
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
      console.error('Hailuo 02 video generation failed:', error);
      throw error;
    }
  },

  /**
   * Check the status of a generation task
   * @param taskId - Task ID returned from submit()
   * @returns Current task status and results
   */
  async checkStatus(taskId: string): Promise<Hailuo02StatusResponse> {
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

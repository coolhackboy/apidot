import { apiService } from './api';
import { appConfig } from '@/data/config';

/**
 * Request interface for Seedance 1.5 Pro video generation
 */
export interface Seedance15SubmitRequest {
  model: "seedance-1.5-pro";
  callback_url?: string;
  input: {
    prompt: string;
    image_urls?: string[]; // Optional for Text-to-Video, required for Image-to-Video
    aspect_ratio?: "1:1" | "21:9" | "4:3" | "3:4" | "16:9" | "9:16";
    resolution?: "480p" | "720p";
    duration?: 4 | 8 | 12;
    fixed_lens?: boolean;
    generate_audio?: boolean;
  };
}

/**
 * Response interface for submit request
 */
export interface Seedance15SubmitResponse {
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
export interface Seedance15StatusData {
  task_id: string;
  status: string; // "not_started", "running", "finished", "failed"
  files?: Array<{
    file_url: string;
    file_type: string; // "video", "audio"
  }>;
  created_time: string;
  progress?: number;
  error_message?: string | null;
}

/**
 * Response interface for status check
 */
export interface Seedance15StatusResponse {
  code: number;
  message?: string;
  data?: Seedance15StatusData;
}

export const seedance15Service = {
  /**
   * Submit a new Seedance 1.5 Pro video generation request
   * @param request - Generation parameters
   * @returns Response with task ID
   */
  async submit(request: Seedance15SubmitRequest): Promise<Seedance15SubmitResponse> {
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
      console.error('Seedance 1.5 Pro video generation failed:', error);
      throw error;
    }
  },

  /**
   * Check the status of a generation task
   * @param taskId - Task ID returned from submit()
   * @returns Current task status and results
   */
  async checkStatus(taskId: string): Promise<Seedance15StatusResponse> {
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

import { apiService } from './api';
import { appConfig } from '@/data/config';

/**
 * Request interface for Nano Banana image generation
 */
export interface NanoBananaSubmitRequest {
  model:
    | "nano-banana-pro"
    | "nano-banana-pro-edit"
    | "nano-banana-2-new"
    | "nano-banana-2-new-edit"
    | "nano-banana-2"
    | "nano-banana-2-edit"
    | "nano-banana"
    | "nano-banana-edit";
  callback_url?: string;
  input: {
    prompt: string;
    resolution?: "1K" | "2K" | "4K";
    size?: "auto" | "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9";
    n?: 1; // Fixed at 1
    google_search?: boolean;
    enable_web_search?: boolean;
    output_format?: "png" | "jpg";
    image_urls?: string[]; // Required for edit models
    mask_url?: string; // PNG mask for editing (max 4MB)
  };
}

/**
 * Response interface for submit request
 */
export interface NanoBananaSubmitResponse {
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
export interface NanoBananaStatusResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    status: string; // "running", "finished", "failed"
    files?: Array<{
      file_url: string;
      file_type: string; // "image", "video", "audio"
    }>;
    created_time: string;
    progress?: number; // 0 to 100
    error_message?: string | null;
  };
}

export const nanoBananaService = {
  /**
   * Submit a new Nano Banana (Gemini 2.5 Flash Image) generation request
   * @param request - Generation parameters
   * @returns Response with task ID
   */
  async submit(request: NanoBananaSubmitRequest): Promise<NanoBananaSubmitResponse> {
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
      console.error('Nano Banana image generation failed:', error);
      throw error;
    }
  },

  /**
   * Check the status of a generation task
   * @param taskId - Task ID returned from submit()
   * @returns Current task status and results
   */
  async checkStatus(taskId: string): Promise<NanoBananaStatusResponse> {
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

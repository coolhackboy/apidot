import { apiService } from './api';
import { appConfig } from '@/data/config';

export interface WanAnimateSubmitRequest {
  model: "wan-animate-replace" | "wan-animate-move";
  video_url: string;
  image_urls: string[];
  resolution?: "480p" | "580p" | "720p";
}

export interface WanAnimateSubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

export interface WanAnimateStatusData {
  task_id: string;
  status: 'not_started' | 'running' | 'finished' | 'failed';
  files?: Array<{
    file_url: string;
    file_type: string; // "video"
  }>;
  created_time: string;
  progress?: number;
  error_message?: string | null;
}

export interface WanAnimateStatusResponse {
  code: number;
  message?: string;
  data?: WanAnimateStatusData;
}

export const wanAnimateApi = {
  /**
   * Submit a new Wan Animate video generation request
   * @param request - Generation parameters
   * @returns Response with task ID
   */
  async submit(request: WanAnimateSubmitRequest): Promise<WanAnimateSubmitResponse> {
    const input: any = {
      video_url: request.video_url,
      image_urls: request.image_urls,
    };

    if (request.resolution) {
      input.resolution = request.resolution;
    }

    const requestBody = {
      model: request.model,
      input,
    };

    try {
      const response = await apiService.post(
        '/api/generate/submit',
        requestBody,
        appConfig.appName
      );

      if (response.code !== 200 && response.code !== 0) {
        throw new Error(response.message || `API request failed with code ${response.code}`);
      }

      return response;
    } catch (error: any) {
      console.error('Wan Animate video generation failed:', error);
      throw error;
    }
  },

  /**
   * Check the status of a video generation task
   * @param taskId - Task ID returned from submit()
   * @returns Current task status and results
   */
  async checkGenerateStatus(taskId: string): Promise<WanAnimateStatusResponse> {
    try {
      const response = await apiService.get(
        `/api/generate/status/${taskId}`,
        appConfig.appName
      );

      if (response.code !== 200 && response.code !== 0) {
        throw new Error(response.message || `Failed to check task status: ${response.code}`);
      }

      return response;
    } catch (error: any) {
      console.error('Failed to check generation status:', error);
      throw error;
    }
  },
};

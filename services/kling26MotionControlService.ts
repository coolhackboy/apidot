import { apiService } from './api';
import { appConfig } from '@/data/config';

export interface Kling26MotionControlSubmitRequest {
  model: "kling-2.6-motion-control"; // Required: model selection
  prompt?: string; // Optional: Max 2,500 chars
  image_urls: string[]; // Required: Single character image
  video_urls: string[]; // Required: Single reference video (3-30 seconds)
  resolution?: "720p" | "1080p"; // Optional: Output resolution
  character_orientation?: "image" | "video"; // Optional: Character orientation
}

export interface Kling26MotionControlSubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

export interface Kling26MotionControlStatusData {
  task_id: string;
  status: 'not_started' | 'running' | 'finished' | 'failed'; // Task status
  files?: Array<{
    file_url: string;
    file_type: string; // "video", "image", "audio"
  }>;
  created_time: string;
  progress?: number; // Progress percentage (0-100)
  error_message?: string | null;
}

export interface Kling26MotionControlStatusResponse {
  code: number;
  message?: string;
  data?: Kling26MotionControlStatusData;
}

export const kling26MotionControlApi = {
  /**
   * Submit a new Kling 2.6 Motion Control video generation request
   * @param request - Generation parameters
   * @returns Response with task ID
   */
  async submit(request: Kling26MotionControlSubmitRequest): Promise<Kling26MotionControlSubmitResponse> {
    // Build request body with input structure
    const input: any = {
      prompt: request.prompt,
      image_urls: request.image_urls,
      video_urls: request.video_urls,
    };

    // Add optional parameters
    if (request.resolution) {
      input.resolution = request.resolution;
    }

    if (request.character_orientation) {
      input.character_orientation = request.character_orientation;
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
      console.error('Kling 2.6 Motion Control video generation failed:', error);
      throw error;
    }
  },

  /**
   * Check the status of a video generation task
   * @param taskId - Task ID returned from submit()
   * @returns Current task status and results
   */
  async checkGenerateStatus(taskId: string): Promise<Kling26MotionControlStatusResponse> {
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

import { apiService } from './api';
import { appConfig } from '@/data/config';

export interface Flux2SubmitRequest {
  model: "flux-2-pro" | "flux-2-pro-edit" | "flux-2-flex" | "flux-2-flex-edit"; // Required: model selection
  prompt: string; // Required: max 1000 characters
  image_urls?: string[]; // Optional: 1-8 images for edit models
  size: "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "3:2" | "2:3" | "auto"; // Required: aspect ratio
  resolution: "1K" | "2K"; // Required: output resolution
}

export interface Flux2SubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

export interface Flux2StatusData {
  task_id: string;
  status: 'not_started' | 'running' | 'finished' | 'failed'; // Task status
  files?: Array<{
    file_url: string;
    file_type: string; // "image"
  }>;
  created_time: string;
  progress?: number; // Progress percentage (0-100)
  error_message?: string | null;
}

export interface Flux2StatusResponse {
  code: number;
  message?: string;
  data?: Flux2StatusData;
}

export const flux2Api = {
  /**
   * Submit a new Flux-2 image generation request
   * @param request - Generation parameters
   * @returns Response with task ID
   */
  async submit(request: Flux2SubmitRequest): Promise<Flux2SubmitResponse> {
    // Build request body with input structure
    const input: any = {
      prompt: request.prompt,
    };

    // Add optional parameters
    if (request.image_urls && request.image_urls.length > 0) {
      input.image_urls = request.image_urls;
    }

    input.size = request.size;
    input.resolution = request.resolution;

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
      console.error('Flux-2 image generation failed:', error);
      throw error;
    }
  },

  /**
   * Check the status of an image generation task
   * @param taskId - Task ID returned from submit()
   * @returns Current task status and results
   */
  async checkGenerateStatus(taskId: string): Promise<Flux2StatusResponse> {
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

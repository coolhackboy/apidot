import { apiService } from './api';
import { appConfig } from '@/data/config';

/**
 * Seedance 2 model identifier
 */
export type Seedance2ModelId = "seedance-2" | "seedance-2-fast";

/**
 * Output resolution. seedance-2 supports 480p, 720p, and 1080p, while
 * seedance-2-fast supports 480p and 720p.
 */
export type Seedance2Resolution = "480p" | "720p" | "1080p";

/**
 * Supported aspect ratios for Seedance 2.
 */
export type Seedance2AspectRatio = "1:1" | "21:9" | "4:3" | "3:4" | "16:9" | "9:16";

/**
 * Request interface for Seedance 2 / Seedance 2 Fast video generation.
 * Matches https://docs.poyo.ai/api-manual/video-series/seedance-2
 *
 * Note: `image_urls` and any `reference_*_urls` fields are mutually exclusive
 * and cannot be used together in the same request.
 */
export interface Seedance2SubmitRequest {
  model: Seedance2ModelId;
  callback_url?: string;
  input: {
    prompt: string;
    /**
     * Optional first and last frame images. Index 0 is the first frame and
     * index 1 is the last frame. Supports up to 2 items.
     */
    image_urls?: string[];
    /**
     * Optional reference image URLs for multimodal reference-to-video mode.
     */
    reference_image_urls?: string[];
    /**
     * Optional reference video URLs for multimodal reference-to-video mode.
     */
    reference_video_urls?: string[];
    /**
     * Optional reference audio URLs for multimodal reference-to-video mode.
     */
    reference_audio_urls?: string[];
    aspect_ratio?: Seedance2AspectRatio;
    resolution: Seedance2Resolution;
    /**
     * Video duration in seconds. Supported values are integers from 4 to 15.
     */
    duration: number;
    generate_audio?: boolean;
    seed?: number;
  };
}

/**
 * Response interface for submit request
 */
export interface Seedance2SubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    status?: string;
    created_time: string;
  };
}

/**
 * Status data interface
 */
export interface Seedance2StatusData {
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
export interface Seedance2StatusResponse {
  code: number;
  message?: string;
  data?: Seedance2StatusData;
}

export const seedance2Service = {
  /**
   * Submit a new Seedance 2 / Seedance 2 Fast video generation request
   * @param request - Generation parameters
   * @returns Response with task ID
   */
  async submit(request: Seedance2SubmitRequest): Promise<Seedance2SubmitResponse> {
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
      console.error('Seedance 2 video generation failed:', error);
      throw error;
    }
  },

  /**
   * Check the status of a generation task
   * @param taskId - Task ID returned from submit()
   * @returns Current task status and results
   */
  async checkStatus(taskId: string): Promise<Seedance2StatusResponse> {
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

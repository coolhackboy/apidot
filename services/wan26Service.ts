import { apiService } from "./api";
import { appConfig } from "@/data/config";

// Wan 2.6 generation modes
export type Wan26Mode = "t2v" | "i2v" | "v2v";

export interface Wan26SubmitRequest {
  model:
    | "wan2.6-text-to-video"
    | "wan2.6-image-to-video"
    | "wan2.6-video-to-video"; // Model selection based on mode
  callback_url?: string; // Optional: Webhook callback URL
  prompt: string; // Required: Video description
  duration?: 5 | 10 | 15; // Optional: Video duration in seconds
  resolution?: "720p" | "1080p"; // Optional: Video resolution
  multi_shots?: boolean; // Optional: Enable multi-shot composition
  image_urls?: string[]; // Optional: For image-to-video (i2v) mode
  video_urls?: string[]; // Optional: For video-to-video (v2v) mode
}

export interface Wan26SubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    status?: "not_started" | "running" | "finished" | "failed";
    created_time: string;
  };
}

export interface Wan26StatusData {
  task_id: string;
  status: "not_started" | "running" | "finished" | "failed"; // Task status
  files?: Array<{
    file_url: string;
    file_type: string; // "video", "image", "audio"
  }>;
  created_time: string;
  progress?: number; // Progress percentage (0-100)
  error_message?: string | null;
}

export interface Wan26StatusResponse {
  code: number;
  message?: string;
  data?: Wan26StatusData;
}

// Credit calculation based on duration and resolution
export const getWan26CreditsAmount = (
  duration: 5 | 10 | 15,
  resolution: "720p" | "1080p"
): number => {
  if (resolution === "720p") {
    if (duration === 5) return 80;
    if (duration === 10) return 160;
    return 240;
  }

  if (duration === 5) return 120;
  if (duration === 10) return 240;
  return 360;
};

export const wan26Api = {
  /**
   * Submit a new Wan 2.6 video generation request
   * @param request - Generation parameters
   * @returns Response with task ID
   */
  async submit(request: Wan26SubmitRequest): Promise<Wan26SubmitResponse> {
    // Build request body with input structure
    const input: Record<string, unknown> = {
      prompt: request.prompt,
    };

    // Add optional parameters
    if (request.duration !== undefined) {
      input.duration = request.duration;
    }

    if (request.resolution) {
      input.resolution = request.resolution;
    }

    if (request.multi_shots !== undefined) {
      input.multi_shots = request.multi_shots;
    }

    // Image-to-video specific
    if (request.image_urls && request.image_urls.length > 0) {
      input.image_urls = request.image_urls;
    }

    // Video-to-video specific
    if (request.video_urls && request.video_urls.length > 0) {
      input.video_urls = request.video_urls;
    }

    const requestBody: Record<string, unknown> = {
      model: request.model,
      input,
    };

    if (request.callback_url) {
      requestBody.callback_url = request.callback_url;
    }

    try {
      const response = await apiService.post(
        "/api/generate/submit",
        requestBody,
        appConfig.appName
      );

      if (response.code !== 200 && response.code !== 0) {
        throw new Error(
          response.message || `API request failed with code ${response.code}`
        );
      }

      return response;
    } catch (error: unknown) {
      console.error("Wan 2.6 video generation failed:", error);
      throw error;
    }
  },

  /**
   * Check the status of a video generation task
   * @param taskId - Task ID returned from submit()
   * @returns Current task status and results
   */
  async checkGenerateStatus(taskId: string): Promise<Wan26StatusResponse> {
    try {
      const response = await apiService.get(
        `/api/generate/status/${taskId}`,
        appConfig.appName
      );

      if (response.code !== 200 && response.code !== 0) {
        throw new Error(
          response.message || `Failed to check task status: ${response.code}`
        );
      }

      return response;
    } catch (error: unknown) {
      console.error("Failed to check generation status:", error);
      throw error;
    }
  },
};

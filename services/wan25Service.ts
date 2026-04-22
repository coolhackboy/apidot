import { appConfig } from "@/data/config";
import { apiService } from "./api";

export type Wan25Model = "wan2.5-image-to-video" | "wan2.5-text-to-video";

export interface Wan25SubmitRequest {
  model: Wan25Model;
  callback_url?: string;
  input: {
    prompt: string;
    duration?: 5 | 10;
    aspect_ratio?: "832*480" | "480*832" | "1280*720" | "720*1280" | "1920*1080" | "1080*1920";
    resolution?: "480p" | "720p" | "1080p";
    image_urls?: string[];
    audio?: string;
    negative_prompt?: string;
    seed?: number;
  };
}

export interface Wan25SubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

export interface Wan25StatusData {
  task_id: string;
  status: "not_started" | "running" | "finished" | "failed";
  files?: Array<{
    file_url: string;
    file_type: string;
  }>;
  created_time: string;
  progress?: number;
  error_message?: string | null;
}

export interface Wan25StatusResponse {
  code: number;
  message?: string;
  data?: Wan25StatusData;
}

export const wan25Service = {
  async submit(request: Wan25SubmitRequest): Promise<Wan25SubmitResponse> {
    const response = await apiService.post("/api/generate/submit", request, appConfig.appName);
    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || `API request failed with code ${response.code}`);
    }
    return response;
  },

  async checkStatus(taskId: string): Promise<Wan25StatusResponse> {
    const response = await apiService.get(`/api/generate/status/${taskId}`, appConfig.appName);
    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || `Failed to check task status: ${response.code}`);
    }
    return response;
  },
};

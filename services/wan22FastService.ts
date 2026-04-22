import { appConfig } from "@/data/config";
import { apiService } from "./api";

export type Wan22FastModel = "wan2.2-image-to-video-fast" | "wan2.2-text-to-video-fast";

export interface Wan22FastSubmitRequest {
  model: Wan22FastModel;
  callback_url?: string;
  input: {
    prompt: string;
    resolution?: "480p" | "720p";
    aspect_ratio?: "16:9" | "1:1" | "9:16" | "4:3" | "3:4" | "21:9" | "9:21";
    seed?: number;
    image_urls?: string[];
  };
}

export interface Wan22FastSubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

export interface Wan22FastStatusData {
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

export interface Wan22FastStatusResponse {
  code: number;
  message?: string;
  data?: Wan22FastStatusData;
}

export const wan22FastService = {
  async submit(request: Wan22FastSubmitRequest): Promise<Wan22FastSubmitResponse> {
    const response = await apiService.post("/api/generate/submit", request, appConfig.appName);
    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || `API request failed with code ${response.code}`);
    }
    return response;
  },

  async checkStatus(taskId: string): Promise<Wan22FastStatusResponse> {
    const response = await apiService.get(`/api/generate/status/${taskId}`, appConfig.appName);
    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || `Failed to check task status: ${response.code}`);
    }
    return response;
  },
};

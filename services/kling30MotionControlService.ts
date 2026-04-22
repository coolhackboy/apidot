import { appConfig } from "@/data/config";
import { apiService } from "./api";

export interface Kling30MotionControlSubmitRequest {
  model: "kling-3.0-motion-control";
  callback_url?: string;
  input: {
    prompt?: string;
    image_urls: string[];
    video_urls: string[];
    character_orientation: "image" | "video";
    resolution?: "720p" | "1080p";
  };
}

export interface Kling30MotionControlSubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

export interface Kling30MotionControlStatusData {
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

export interface Kling30MotionControlStatusResponse {
  code: number;
  message?: string;
  data?: Kling30MotionControlStatusData;
}

export const kling30MotionControlService = {
  async submit(request: Kling30MotionControlSubmitRequest): Promise<Kling30MotionControlSubmitResponse> {
    const response = await apiService.post("/api/generate/submit", request, appConfig.appName);
    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || `API request failed with code ${response.code}`);
    }
    return response;
  },

  async checkStatus(taskId: string): Promise<Kling30MotionControlStatusResponse> {
    const response = await apiService.get(`/api/generate/status/${taskId}`, appConfig.appName);
    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || `Failed to check task status: ${response.code}`);
    }
    return response;
  },
};

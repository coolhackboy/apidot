import { appConfig } from "@/data/config";
import { apiService } from "./api";

export interface Sora2OfficialSubmitRequest {
  model: "sora-2-official";
  callback_url?: string;
  input: {
    prompt: string;
    duration?: 4 | 8 | 12 | 16 | 20;
    aspect_ratio?: "16:9" | "9:16";
    image_urls?: string[];
  };
}

export interface Sora2OfficialSubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

export interface Sora2OfficialStatusData {
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

export interface Sora2OfficialStatusResponse {
  code: number;
  message?: string;
  data?: Sora2OfficialStatusData;
}

export const sora2OfficialService = {
  async submit(request: Sora2OfficialSubmitRequest): Promise<Sora2OfficialSubmitResponse> {
    const response = await apiService.post("/api/generate/submit", request, appConfig.appName);
    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || `API request failed with code ${response.code}`);
    }
    return response;
  },

  async checkStatus(taskId: string): Promise<Sora2OfficialStatusResponse> {
    const response = await apiService.get(`/api/generate/status/${taskId}`, appConfig.appName);
    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || `Failed to check task status: ${response.code}`);
    }
    return response;
  },
};

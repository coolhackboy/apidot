import { appConfig } from "@/data/config";
import { apiService } from "./api";

export interface Hailuo23SubmitRequest {
  model: "hailuo-2.3";
  callback_url?: string;
  input: {
    prompt: string;
    duration?: 6 | 10;
    resolution?: "768p" | "1080p";
    prompt_optimizer?: boolean;
    start_image_url?: string;
  };
}

export interface Hailuo23SubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

export interface Hailuo23StatusData {
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

export interface Hailuo23StatusResponse {
  code: number;
  message?: string;
  data?: Hailuo23StatusData;
}

export const hailuo23Service = {
  async submit(request: Hailuo23SubmitRequest): Promise<Hailuo23SubmitResponse> {
    const response = await apiService.post("/api/generate/submit", request, appConfig.appName);
    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || `API request failed with code ${response.code}`);
    }
    return response;
  },

  async checkStatus(taskId: string): Promise<Hailuo23StatusResponse> {
    const response = await apiService.get(`/api/generate/status/${taskId}`, appConfig.appName);
    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || `Failed to check task status: ${response.code}`);
    }
    return response;
  },
};

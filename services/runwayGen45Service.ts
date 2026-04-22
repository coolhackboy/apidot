import { appConfig } from "@/data/config";
import { apiService } from "./api";

export interface RunwayGen45SubmitRequest {
  model: "runway-gen-4.5";
  callback_url?: string;
  input: {
    prompt: string;
    duration?: 5 | 10;
    aspect_ratio?: "16:9" | "9:16" | "4:3" | "3:4" | "1:1" | "21:9";
    image_urls?: string[];
    seed?: number;
  };
}

export interface RunwayGen45SubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

export interface RunwayGen45StatusData {
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

export interface RunwayGen45StatusResponse {
  code: number;
  message?: string;
  data?: RunwayGen45StatusData;
}

export const runwayGen45Service = {
  async submit(request: RunwayGen45SubmitRequest): Promise<RunwayGen45SubmitResponse> {
    const response = await apiService.post("/api/generate/submit", request, appConfig.appName);
    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || `API request failed with code ${response.code}`);
    }
    return response;
  },

  async checkStatus(taskId: string): Promise<RunwayGen45StatusResponse> {
    const response = await apiService.get(`/api/generate/status/${taskId}`, appConfig.appName);
    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || `Failed to check task status: ${response.code}`);
    }
    return response;
  },
};

import { appConfig } from "@/data/config";
import { apiService } from "./api";

export type Kling21Model = "kling-2.1/standard" | "kling-2.1/pro";

export interface Kling21SubmitRequest {
  model: Kling21Model;
  callback_url?: string;
  input: {
    prompt: string;
    duration?: 5 | 10;
    start_image_url: string;
    end_image_url?: string;
    negative_prompt?: string;
  };
}

export interface Kling21SubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

export interface Kling21StatusData {
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

export interface Kling21StatusResponse {
  code: number;
  message?: string;
  data?: Kling21StatusData;
}

export const kling21Service = {
  async submit(request: Kling21SubmitRequest): Promise<Kling21SubmitResponse> {
    const response = await apiService.post("/api/generate/submit", request, appConfig.appName);
    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || `API request failed with code ${response.code}`);
    }
    return response;
  },

  async checkStatus(taskId: string): Promise<Kling21StatusResponse> {
    const response = await apiService.get(`/api/generate/status/${taskId}`, appConfig.appName);
    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || `Failed to check task status: ${response.code}`);
    }
    return response;
  },
};

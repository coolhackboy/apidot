import { appConfig } from "@/data/config";
import { apiService } from "./api";

export interface Kling25TurboProSubmitRequest {
  model: "kling-2.5-turbo-pro";
  callback_url?: string;
  input: {
    prompt: string;
    duration?: 5 | 10;
    start_image_url?: string;
    end_image_url?: string;
    aspect_ratio?: string;
    negative_prompt?: string;
  };
}

export interface Kling25TurboProSubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

export interface Kling25TurboProStatusData {
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

export interface Kling25TurboProStatusResponse {
  code: number;
  message?: string;
  data?: Kling25TurboProStatusData;
}

export const kling25TurboProService = {
  async submit(request: Kling25TurboProSubmitRequest): Promise<Kling25TurboProSubmitResponse> {
    const response = await apiService.post("/api/generate/submit", request, appConfig.appName);
    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || `API request failed with code ${response.code}`);
    }
    return response;
  },

  async checkStatus(taskId: string): Promise<Kling25TurboProStatusResponse> {
    const response = await apiService.get(`/api/generate/status/${taskId}`, appConfig.appName);
    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || `Failed to check task status: ${response.code}`);
    }
    return response;
  },
};

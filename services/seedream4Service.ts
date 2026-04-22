import { apiService } from "./api";
import { appConfig } from "@/data/config";

export interface Seedream4SubmitRequest {
  model: "seedream-4" | "seedream-4-edit";
  callback_url?: string;
  input: {
    prompt: string;
    size?: "1:1" | "3:4" | "4:3" | "16:9" | "9:16" | "3:2" | "2:3" | "21:9";
    resolution?: "1K" | "2K" | "4K";
    n?: number;
    image_urls?: string[];
  };
}

export interface Seedream4SubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

export interface Seedream4StatusResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    status: "not_started" | "processing" | "running" | "finished" | "failed";
    files?: Array<{
      file_url: string;
      file_type: string;
    }>;
    created_time: string;
    error_message?: string | null;
  };
}

export const seedream4Service = {
  async submit(request: Seedream4SubmitRequest): Promise<Seedream4SubmitResponse> {
    try {
      const response = await apiService.post("/api/generate/submit", request, appConfig.appName);

      if (response.code && response.code !== 0 && response.code !== 200) {
        throw new Error(response.message || `API request failed with code ${response.code}`);
      }

      return response;
    } catch (error: any) {
      console.error("Seedream 4 image generation failed:", error);
      throw error;
    }
  },

  async checkStatus(taskId: string): Promise<Seedream4StatusResponse> {
    try {
      const response = await apiService.get(`/api/generate/status/${taskId}`, appConfig.appName);

      if (response.code && response.code !== 0 && response.code !== 200) {
        throw new Error(response.message || `Failed to check task status: ${response.code}`);
      }

      return response;
    } catch (error: any) {
      console.error("Failed to check Seedream 4 task status:", error);
      throw error;
    }
  },
};

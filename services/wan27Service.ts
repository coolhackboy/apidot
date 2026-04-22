import { apiService } from "./api";
import { appConfig } from "@/data/config";

export type Wan27Model = "wan-2.7-image" | "wan-2.7-image-pro";
export type Wan27SizePreset =
  | "512x512"
  | "1024x1024"
  | "768x1024"
  | "1024x768"
  | "576x1024"
  | "1024x576";

export interface Wan27CustomSize {
  width: number;
  height: number;
}

export interface Wan27SubmitRequest {
  model: Wan27Model;
  callback_url?: string;
  input: {
    prompt: string;
    size?: Wan27SizePreset | Wan27CustomSize;
    n?: 1 | 2 | 3 | 4;
    seed?: number;
    image_urls?: string[];
  };
}

export interface Wan27SubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

export interface Wan27StatusResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    status: string;
    files?: Array<{
      file_url: string;
      file_type: string;
    }>;
    created_time: string;
    error_message?: string | null;
  };
}

export const wan27Service = {
  async submit(request: Wan27SubmitRequest): Promise<Wan27SubmitResponse> {
    const response = await apiService.post(
      "/api/generate/submit",
      request,
      appConfig.appName
    );

    if (response.code && response.code !== 0 && response.code !== 200) {
      throw new Error(response.message || `API request failed with code ${response.code}`);
    }

    return response;
  },

  async checkStatus(taskId: string): Promise<Wan27StatusResponse> {
    const response = await apiService.get(
      `/api/generate/status/${taskId}`,
      appConfig.appName
    );

    if (response.code && response.code !== 0 && response.code !== 200) {
      throw new Error(response.message || `Failed to check task status: ${response.code}`);
    }

    return response;
  },
};

import { apiService } from "./api";
import { appConfig } from "@/data/config";

export type KlingOImageModel =
  | "kling-o3-image"
  | "kling-o3-image-edit"
  | "kling-o1-image-edit";

export type KlingOImageResolution = "1K" | "2K" | "4K";
export type KlingOImageResultType = "single" | "series";
export type KlingOImageSize =
  | "auto"
  | "16:9"
  | "9:16"
  | "1:1"
  | "4:3"
  | "3:4"
  | "3:2"
  | "2:3"
  | "21:9";
export type KlingOImageFormat = "jpg" | "jpeg" | "png" | "webp";

export interface KlingOImageSubmitRequest {
  model: KlingOImageModel;
  input: {
    prompt: string;
    image_urls?: string[];
    elements?: Array<Record<string, unknown>>;
    resolution?: KlingOImageResolution;
    result_type?: KlingOImageResultType;
    size?: KlingOImageSize;
    output_format?: KlingOImageFormat;
    n?: number;
    series_amount?: number;
  };
}

export interface KlingOImageSubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
    status?: string;
  };
}

export interface KlingOImageStatusResponse {
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
    progress?: number;
    error_message?: string | null;
  };
}

export const klingOImageService = {
  async submit(request: KlingOImageSubmitRequest): Promise<KlingOImageSubmitResponse> {
    try {
      const response = await apiService.post("/api/generate/submit", request, appConfig.appName);

      if (response.code && response.code !== 0 && response.code !== 200) {
        throw new Error(response.message || `API request failed with code ${response.code}`);
      }

      return response;
    } catch (error: any) {
      console.error("Kling O image generation failed:", error);
      throw error;
    }
  },

  async checkStatus(taskId: string): Promise<KlingOImageStatusResponse> {
    try {
      const response = await apiService.get(`/api/generate/status/${taskId}`, appConfig.appName);

      if (response.code && response.code !== 0 && response.code !== 200) {
        throw new Error(response.message || `Failed to check task status: ${response.code}`);
      }

      return response;
    } catch (error: any) {
      console.error("Failed to check Kling O image task status:", error);
      throw error;
    }
  },
};

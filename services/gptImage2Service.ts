import { apiService } from "./api";
import { appConfig } from "@/data/config";

export type GptImage2ModelId = "gpt-image-2" | "gpt-image-2-edit";
export type GptImage2Size = "1024x1024" | "1536x1024" | "1024x1536";

export interface GptImage2SubmitRequest {
  model: GptImage2ModelId;
  callback_url?: string;
  input: {
    prompt: string;
    size?: GptImage2Size;
    n?: 1 | 2 | 3 | 4;
    image_urls?: string[];
  };
}

export interface GptImage2SubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

export interface GptImage2StatusResponse {
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
    progress?: number;
    error_message?: string | null;
  };
}

export const gptImage2Service = {
  async submit(request: GptImage2SubmitRequest): Promise<GptImage2SubmitResponse> {
    try {
      const response = await apiService.post("/api/generate/submit", request, appConfig.appName);

      if (response.code && response.code !== 0 && response.code !== 200) {
        throw new Error(response.message || `API request failed with code ${response.code}`);
      }

      return response;
    } catch (error: any) {
      console.error("GPT Image 2 generation failed:", error);
      throw error;
    }
  },

  async checkStatus(taskId: string): Promise<GptImage2StatusResponse> {
    try {
      const response = await apiService.get(
        `/api/generate/status/${taskId}`,
        appConfig.appName,
      );

      if (response.code && response.code !== 0 && response.code !== 200) {
        throw new Error(response.message || `Failed to check task status: ${response.code}`);
      }

      return response;
    } catch (error: any) {
      console.error("Failed to check GPT Image 2 status:", error);
      throw error;
    }
  },
};

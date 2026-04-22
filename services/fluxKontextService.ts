import { apiService } from "./api";
import { appConfig } from "@/data/config";

export interface FluxKontextSubmitRequest {
  model: "flux-kontext-pro" | "flux-kontext-pro-edit" | "flux-kontext-max" | "flux-kontext-max-edit";
  callback_url?: string;
  input: {
    prompt: string;
    size?: "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "21:9" | "16:21";
    output_format?: "png" | "jpg";
    image_urls?: string[];
  };
}

export interface FluxKontextSubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    created_time: string;
  };
}

export interface FluxKontextStatusResponse {
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

export const fluxKontextService = {
  async submit(request: FluxKontextSubmitRequest): Promise<FluxKontextSubmitResponse> {
    try {
      const response = await apiService.post("/api/generate/submit", request, appConfig.appName);

      if (response.code && response.code !== 0 && response.code !== 200) {
        throw new Error(response.message || `API request failed with code ${response.code}`);
      }

      return response;
    } catch (error: any) {
      console.error("Flux Kontext generation failed:", error);
      throw error;
    }
  },

  async checkStatus(taskId: string): Promise<FluxKontextStatusResponse> {
    try {
      const response = await apiService.get(`/api/generate/status/${taskId}`, appConfig.appName);

      if (response.code && response.code !== 0 && response.code !== 200) {
        throw new Error(response.message || `Failed to check task status: ${response.code}`);
      }

      return response;
    } catch (error: any) {
      console.error("Failed to check Flux Kontext task status:", error);
      throw error;
    }
  },
};

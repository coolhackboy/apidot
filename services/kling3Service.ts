import { apiService } from './api';
import { appConfig } from '@/data/config';

// --- Request Types ---

export interface Kling3Element {
  name: string;
  description: string;
  element_input_urls?: string[];       // 2-4 images (JPG/PNG, max 10MB each)
  element_input_video_urls?: string[]; // 1 video (MP4/MOV, max 50MB)
}

export interface Kling3MultiPrompt {
  prompt: string;    // max 2500 chars
  duration: number;  // 1-12 seconds per shot
}

export interface Kling3SubmitRequest {
  model: "kling-3.0/standard" | "kling-3.0/pro";
  callback_url?: string;
  input: {
    duration: number;        // 3-15 seconds total
    multi_shots: boolean;
    prompt?: string;         // required when multi_shots=false, max 2500 chars
    multi_prompt?: Kling3MultiPrompt[];  // required when multi_shots=true
    image_urls?: string[];
    sound?: boolean;         // default true. When multi_shots is true, must be true
    aspect_ratio?: "1:1" | "16:9" | "9:16";
    kling_elements?: Kling3Element[];
  };
}

export interface Kling3SubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    status: string;
    created_time: string;
  };
}

// --- Status Types (shared pattern with Kling 2.6) ---

export interface Kling3StatusData {
  task_id: string;
  status: 'not_started' | 'running' | 'finished' | 'failed';
  files?: Array<{
    file_url: string;
    file_type: string; // "video", "image", "audio"
  }>;
  created_time: string;
  progress?: number;
  error_message?: string | null;
}

export interface Kling3StatusResponse {
  code: number;
  message?: string;
  data?: Kling3StatusData;
}

// --- API Methods ---

export const kling3Api = {
  async submit(request: Kling3SubmitRequest): Promise<Kling3SubmitResponse> {
    const requestBody = {
      model: request.model,
      ...(request.callback_url && { callback_url: request.callback_url }),
      input: request.input,
    };

    try {
      const response = await apiService.post(
        '/api/generate/submit',
        requestBody,
        appConfig.appName
      );

      if (response.code !== 200 && response.code !== 0) {
        throw new Error(response.message || `API request failed with code ${response.code}`);
      }

      return response;
    } catch (error: any) {
      console.error('Kling 3.0 video generation failed:', error);
      throw error;
    }
  },

  async checkGenerateStatus(taskId: string): Promise<Kling3StatusResponse> {
    try {
      const response = await apiService.get(
        `/api/generate/status/${taskId}`,
        appConfig.appName
      );

      if (response.code !== 200 && response.code !== 0) {
        throw new Error(response.message || `Failed to check task status: ${response.code}`);
      }

      return response;
    } catch (error: any) {
      console.error('Failed to check generation status:', error);
      throw error;
    }
  },
};

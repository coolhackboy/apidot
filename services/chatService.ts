import { apiService } from "./api";
import { appConfig } from "@/data/config";

export interface ChatCompletionRequest {
  model: string;
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Anthropic Messages API types
export interface MessagesRequest {
  model: string;
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
  system?: string;
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

export interface MessagesResponse {
  id: string;
  type: string;
  role: string;
  content: { type: string; text: string }[];
  model: string;
  usage: { input_tokens: number; output_tokens: number };
}

// Gemini Native API types
export interface GeminiRequest {
  contents: { role: "user" | "model"; parts: { text: string }[] }[];
  systemInstruction?: { parts: { text: string }[] };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
  };
}

export interface GeminiResponse {
  candidates: {
    content: { parts: { text: string }[]; role: string };
    finishReason: string;
  }[];
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export const chatService = {
  /**
   * Send a chat completion request (non-streaming)
   */
  async sendMessage(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const token = apiService.getAppToken(appConfig.appName);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

    const response = await fetch(`${apiUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...request, stream: false }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message ||
          error.error?.message ||
          `API error: ${response.status}`
      );
    }

    return response.json();
  },

  /**
   * Send a streaming chat completion request.
   * Returns the raw Response for SSE stream processing.
   */
  async sendMessageStream(
    request: ChatCompletionRequest
  ): Promise<Response> {
    const token = apiService.getAppToken(appConfig.appName);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

    const response = await fetch(`${apiUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message ||
          error.error?.message ||
          `API error: ${response.status}`
      );
    }

    return response;
  },

  /**
   * Send an Anthropic Messages API request (non-streaming)
   */
  async sendMessages(
    request: MessagesRequest
  ): Promise<MessagesResponse> {
    const token = apiService.getAppToken(appConfig.appName);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

    const response = await fetch(`${apiUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { "x-api-key": token } : {}),
      },
      body: JSON.stringify({ ...request, stream: false }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message ||
          error.error?.message ||
          `API error: ${response.status}`
      );
    }

    return response.json();
  },

  /**
   * Send a streaming Anthropic Messages API request.
   * Returns the raw Response for SSE stream processing.
   */
  async sendMessagesStream(
    request: MessagesRequest
  ): Promise<Response> {
    const token = apiService.getAppToken(appConfig.appName);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

    const response = await fetch(`${apiUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { "x-api-key": token } : {}),
      },
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message ||
          error.error?.message ||
          `API error: ${response.status}`
      );
    }

    return response;
  },

  /**
   * Send a Gemini Native API request (non-streaming)
   */
  async sendGeminiMessage(
    model: string,
    request: GeminiRequest
  ): Promise<GeminiResponse> {
    const token = apiService.getAppToken(appConfig.appName);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

    const response = await fetch(
      `${apiUrl}/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message ||
          error.error?.message ||
          `API error: ${response.status}`
      );
    }

    return response.json();
  },

  /**
   * Send a streaming Gemini Native API request.
   * Returns the raw Response for SSE stream processing.
   */
  async sendGeminiMessageStream(
    model: string,
    request: GeminiRequest
  ): Promise<Response> {
    const token = apiService.getAppToken(appConfig.appName);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

    const response = await fetch(
      `${apiUrl}/v1beta/models/${model}:streamGenerateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message ||
          error.error?.message ||
          `API error: ${response.status}`
      );
    }

    return response;
  },
};

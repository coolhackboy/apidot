import { apiService } from "./api";
import { appConfig } from "@/data/config";

// Type definitions for API Key operations
export interface ApiKey {
  id: number;
  api_key: string;
  name: string;
  rate_limit: number;
  ip_whitelist: string[] | null;
  hourly_credit_limit: number;
  daily_credit_limit: number;
  hourly_used: number;
  daily_used: number;
  last_used_at: string;
  created_time: string;
}

export interface CreateApiKeyRequest {
  name: string;
  rate_limit?: number;
  ip_whitelist?: string[];
  hourly_credit_limit?: number;
  daily_credit_limit?: number;
}

export interface CreateApiKeyResponse {
  api_key: string;
  name: string;
  created_time: string;
}

export interface UpdateApiKeyRequest {
  key_id: number;
  name?: string;
  rate_limit?: number;
  ip_whitelist?: string[];
  hourly_credit_limit?: number;
  daily_credit_limit?: number;
}

export interface DeleteApiKeyRequest {
  key_id: number;
}

export interface ApiResponse<T> {
  code?: number;
  message?: string;
  data?: T;
}

// Get auth headers with token
async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = apiService.getAppToken(appConfig.appName);
  if (!token) {
    throw new Error("No authentication token found");
  }

  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

export const apiKeyService = {
  /**
   * List all API keys for the current user
   */
  async listApiKeys(): Promise<ApiKey[]> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/api-keys/list", {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to list API keys");
      }

      const data = await response.json();
      // The API returns an array directly
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error listing API keys:", error);
      throw error;
    }
  },

  /**
   * Create a new API key
   */
  async createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/api-keys/create", {
        method: "POST",
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create API key");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating API key:", error);
      throw error;
    }
  },

  /**
   * Update an existing API key
   */
  async updateApiKey(request: UpdateApiKeyRequest): Promise<{ message: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/api-keys/update", {
        method: "POST",
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update API key");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating API key:", error);
      throw error;
    }
  },

  /**
   * Delete an API key
   */
  async deleteApiKey(request: DeleteApiKeyRequest): Promise<{ message: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/api-keys/delete", {
        method: "POST",
        headers,
        body: JSON.stringify({
          key_id: request.key_id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete API key");
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting API key:", error);
      throw error;
    }
  },
};

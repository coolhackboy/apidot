import { apiService } from "./api";
import { appConfig } from "@/data/config";

// Type definitions for Error Rules operations
export interface ErrorRule {
  id: number;
  rule_name: string;
  match_type: "keyword" | "regex" | "error_code";
  match_value: string;
  normalized_message: string;
  user_prompt: string | null;
  priority: number;
  status: "enabled" | "disabled";
  remark: string;
  created_time: string;
  updated_time: string;
}

export interface ErrorRulesListResponse {
  total: number;
  page: number;
  page_size: number;
  items: ErrorRule[];
}

export interface CreateErrorRuleRequest {
  rule_name: string;
  match_type: "keyword" | "regex" | "error_code";
  match_value: string;
  normalized_message: string;
  user_prompt?: string;
  priority?: number;
  status?: "enabled" | "disabled";
  remark?: string;
}

export interface UpdateErrorRuleRequest {
  rule_name?: string;
  match_type?: "keyword" | "regex" | "error_code";
  match_value?: string;
  normalized_message?: string;
  user_prompt?: string;
  priority?: number;
  status?: "enabled" | "disabled";
  remark?: string;
}

export interface TestMatchRequest {
  error_message: string;
  error_code?: string | null;
}

export interface TestMatchResponse {
  matched: boolean;
  matched_rule?: {
    rule_id: number;
    rule_name: string;
    match_type: string;
    match_value: string;
    normalized_message: string;
    user_prompt: string | null;
    priority: number;
  };
  normalized_message: string;
  default_message: string;
}

export interface ListRulesParams {
  page?: number;
  page_size?: number;
  status?: "enabled" | "disabled";
  match_type?: "keyword" | "regex" | "error_code";
  search_keyword?: string;
}

// Get auth headers with token
async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = apiService.getAppToken(appConfig.appName);
  if (!token) {
    throw new Error("No authentication token found");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export const errorRulesService = {
  /**
   * List all error rules with pagination and filters
   */
  async listRules(params: ListRulesParams = {}): Promise<ErrorRulesListResponse> {
    try {
      const headers = await getAuthHeaders();
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append("page", params.page.toString());
      if (params.page_size)
        queryParams.append("page_size", params.page_size.toString());
      if (params.status) queryParams.append("status", params.status);
      if (params.match_type) queryParams.append("match_type", params.match_type);
      if (params.search_keyword)
        queryParams.append("search_keyword", params.search_keyword);

      const url = `/api/admin/error-rules${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to list error rules");
      }

      return await response.json();
    } catch (error) {
      console.error("Error listing error rules:", error);
      throw error;
    }
  },

  /**
   * Create a new error rule
   */
  async createRule(data: CreateErrorRuleRequest): Promise<ErrorRule> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/admin/error-rules", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create error rule");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating error rule:", error);
      throw error;
    }
  },

  /**
   * Update an existing error rule
   */
  async updateRule(
    id: number,
    data: UpdateErrorRuleRequest
  ): Promise<ErrorRule> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/error-rules/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update error rule");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating error rule:", error);
      throw error;
    }
  },

  /**
   * Delete an error rule
   */
  async deleteRule(id: number): Promise<{ message: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/error-rules/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete error rule");
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting error rule:", error);
      throw error;
    }
  },

  /**
   * Update rule status (enable/disable)
   */
  async updateStatus(
    id: number,
    status: "enabled" | "disabled"
  ): Promise<{ message: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/error-rules/${id}/status`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update rule status");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating rule status:", error);
      throw error;
    }
  },

  /**
   * Test error matching
   */
  async testMatch(data: TestMatchRequest): Promise<TestMatchResponse> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/admin/error-rules/test", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to test error matching");
      }

      return await response.json();
    } catch (error) {
      console.error("Error testing error matching:", error);
      throw error;
    }
  },

  /**
   * Refresh error rules cache
   */
  async refreshCache(): Promise<{ message: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/admin/error-rules/refresh-cache", {
        method: "POST",
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to refresh cache");
      }

      return await response.json();
    } catch (error) {
      console.error("Error refreshing cache:", error);
      throw error;
    }
  },
};

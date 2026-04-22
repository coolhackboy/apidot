import { apiService } from "./api";
import { appConfig } from "@/data/config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Type definitions for User Management operations
export interface AdminUser {
  uid: number;
  email: string;
  user_name: string;
  credits_amount: number;
  ref_code: string;
  user_avatar: string;
  vendor_code: string;
  plan_code: string;
  status: string; // 'free' | 'onepay' | 'month' | 'year'
  start_date: string;
  end_date: string;
  last_login_time: string;
  last_login_ip: string;
  source: string;
  internal_source: string;
  country: string;
  created_time: string;
}

export interface UserListResponse {
  total: number;
  page: number;
  page_size: number;
  items: AdminUser[];
}

export interface ListUsersParams {
  page?: number;
  page_size?: number;
  user_name?: string;
  email?: string;
  vendor_code?: string;
  status?: string;
}

export interface AddCreditsRequest {
  uid: number;
  credits: number;
}

export interface SetRateLimitRequest {
  uid: number;
  limit: number;
  window?: number;
  scope?: string;
}

export interface RateLimitOverride {
  limit: number;
  window: number;
}

export interface RateLimitScope {
  scope: string;
  key: string;
  override: RateLimitOverride | null;
}

export interface RateLimitData {
  uid: number;
  scoped: RateLimitScope;
  global: RateLimitScope;
}

export interface SetRateLimitResponse {
  uid: number;
  limit: number;
  window: number;
  scope: string;
  key: string;
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

export const userManagementService = {
  /**
   * List all users with pagination and filters
   */
  async listUsers(params: ListUsersParams = {}): Promise<UserListResponse> {
    try {
      const headers = await getAuthHeaders();
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append("page", params.page.toString());
      if (params.page_size)
        queryParams.append("page_size", params.page_size.toString());
      if (params.user_name) queryParams.append("user_name", params.user_name);
      if (params.email) queryParams.append("email", params.email);
      if (params.vendor_code)
        queryParams.append("vendor_code", params.vendor_code);
      if (params.status) queryParams.append("status", params.status);

      const url = `${API_URL}/api/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to list users");
      }

      const result = await response.json();
      if (result.code === 200) {
        return result.data;
      }
      throw new Error(result.message || "Failed to list users");
    } catch (error) {
      console.error("Error listing users:", error);
      throw error;
    }
  },

  /**
   * Add credits to a user
   */
  async addCredits(data: AddCreditsRequest): Promise<AdminUser> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/admin/users/add_credits`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add credits");
      }

      const result = await response.json();
      if (result.code === 200) {
        return result.data;
      }
      throw new Error(result.message || "Failed to add credits");
    } catch (error) {
      console.error("Error adding credits:", error);
      throw error;
    }
  },

  /**
   * Get rate limit for a user
   */
  async getRateLimit(uid: number): Promise<RateLimitData | null> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_URL}/api/admin/rate-limit/user?uid=${uid}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get rate limit");
      }

      const result = await response.json();
      if (result.code === 0) {
        // 直接返回包含 scoped 和 global 的数据
        return result.data;
      }
      throw new Error(result.message || "Failed to get rate limit");
    } catch (error) {
      console.error("Error getting rate limit:", error);
      throw error;
    }
  },

  /**
   * Set rate limit for a user
   */
  async setRateLimit(data: SetRateLimitRequest): Promise<SetRateLimitResponse> {
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        uid: data.uid.toString(),
        limit: data.limit.toString(),
      });

      // Only add window if provided
      if (data.window !== undefined) {
        params.append("window", data.window.toString());
      }

      // Add scope parameter (empty string for global override)
      if (data.scope !== undefined) {
        params.append("scope", data.scope);
      }

      const response = await fetch(
        `${API_URL}/api/admin/rate-limit/user?${params.toString()}`,
        {
          method: "POST",
          headers,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to set rate limit");
      }

      const result = await response.json();
      if (result.code === 0) {
        return result.data;
      }
      throw new Error(result.message || "Failed to set rate limit");
    } catch (error) {
      console.error("Error setting rate limit:", error);
      throw error;
    }
  },
};

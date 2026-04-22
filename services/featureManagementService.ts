import { apiService } from "./api";
import { appConfig } from "@/data/config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface Feature {
  code: string;
  name: string;
  vendor_code: string;
  model_code: string;
  credits_amount: number;
  feature_type: string;
  is_option: boolean;
  parent_code: string;
  sort_order: number;
  status: number;
  public_model_id: string;
  submit_method: string;
  fallback_config: {
    fallback_models: Array<{
      model_code: string;
      priority: number;
      enabled: boolean;
    }>;
    max_retries: number;
    timeout: number;
  };
  created_userid: string;
  updated_userid: string;
  created_time: string;
  updated_time: string;
}

export interface ListFeaturesParams {
  page?: number;
  page_size?: number;
  public_model_id?: string;
}

export interface FeatureListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Feature[];
}

export interface UpdateFeatureRequest {
  code: string;
  model_code: string;
  fallback_config: {
    fallback_models: Array<{
      model_code: string;
      priority: number;
      enabled: boolean;
    }>;
    max_retries: number;
    timeout: number;
  };
}

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

export const featureManagementService = {
  async listFeatures(params: ListFeaturesParams = {}): Promise<FeatureListResponse> {
    try {
      const headers = await getAuthHeaders();
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append("page", params.page.toString());
      if (params.page_size) queryParams.append("page_size", params.page_size.toString());
      if (params.public_model_id) queryParams.append("public_model_id", params.public_model_id);

      const url = `${API_URL}/api/admin/features${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to list features");
      }

      const result = await response.json();
      if (result.code === 200) {
        return result.data;
      }
      throw new Error(result.message || "Failed to list features");
    } catch (error) {
      console.error("Error listing features:", error);
      throw error;
    }
  },

  async updateFeature(data: UpdateFeatureRequest): Promise<Feature> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/admin/update_features`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: data.code,
          model_code: data.model_code,
          fallback_config: data.fallback_config,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update feature");
      }

      const result = await response.json();
      if (result.code === 200) {
        return result.data;
      }
      throw new Error(result.message || "Failed to update feature");
    } catch (error) {
      console.error("Error updating feature:", error);
      throw error;
    }
  },
};

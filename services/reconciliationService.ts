import { apiService } from "./api";
import { appConfig } from "@/data/config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface ReconciliationRequest {
  start_time: string;
  end_time: string;
  feature_codes?: string[];
  model_name_prefix?: string;
  public_model_ids?: string[];
}

export interface ChannelUsageItem {
  feature_code: string;
  model_name: string;
  failover_retry_count: number;
  supplier_name: string;
  model_code: string;
  count: number;
  success_count: number;
}

export interface ReconciliationData {
  total_credits_amount: number;
  channel_usage: ChannelUsageItem[];
}

export interface ReconciliationResponse {
  code: number;
  data: ReconciliationData;
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

export const reconciliationService = {
  async queryReconciliation(request: ReconciliationRequest): Promise<ReconciliationResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/generate/reconciliation`, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to query reconciliation data");
    }

    return response.json();
  },
};

import { apiService } from "./api";
import { appConfig } from "@/data/config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface ChannelApiKeyItem {
  id: number;
  channel: "fal" | "replicate";
  supplier_code: string;
  supplier_name: string;
  service_url: string;
  api_key: string;
  masked_api_key: string;
  masked_admin_api_key: string;
  status: number;
  current_task_counts: number;
  is_current_supplier_key: boolean;
  created_time: string | null;
  updated_time: string | null;
}

export interface ChannelApiKeyListResponse {
  total: number;
  items: ChannelApiKeyItem[];
}

export interface FalBalanceResponse {
  channel: "fal";
  current_balance: number | null;
  message: string;
  raw_response: Record<string, unknown>;
}

export interface ChannelApiKeyTestResult {
  channel: "fal" | "replicate";
  model: string;
  status: number;
  body: unknown;
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

async function parseError(response: Response): Promise<string> {
  try {
    const error = await response.json();
    return error.message || error.detail || "Request failed";
  } catch {
    return "Request failed";
  }
}

export const channelApiKeysService = {
  async listChannelApiKeys(): Promise<ChannelApiKeyListResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/channel-api-keys`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    const result = await response.json();
    if (result.code !== 200) {
      throw new Error(result.message || "Failed to load channel API keys");
    }

    return result.data;
  },

  async queryFalBalance(poolId: number): Promise<FalBalanceResponse> {
    // fal 余额仍走后端，避免把 admin_api_key 暴露给浏览器。
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_URL}/api/admin/channel-api-keys/balance?pool_id=${poolId}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    const result = await response.json();
    if (result.code !== 200) {
      throw new Error(result.message || "Failed to query fal balance");
    }

    return result.data;
  },

  async testChannelApiKey(
    item: Pick<ChannelApiKeyItem, "channel" | "service_url" | "api_key">
  ): Promise<ChannelApiKeyTestResult> {
    // 测试只通过前端中转，不走 poyoapi-python 的测试接口。
    const headers = await getAuthHeaders();
    const response = await fetch("/api/admin/channel-api-keys/test", {
      method: "POST",
      headers,
      body: JSON.stringify({
        channel: item.channel,
        service_url: item.service_url,
        api_key: item.api_key,
      }),
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    return response.json();
  },
};

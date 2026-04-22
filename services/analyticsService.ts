/**
 * Analytics Service
 *
 * 转化率漏斗和数据分析 API 服务
 */

import { appConfig } from "@/data/config";

// 获取 API 基础 URL
const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "";

// 获取认证 headers
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem(`${appConfig.appName}_token`)
    : null;

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

// 时间范围类型
export type TimeRange = 'week' | 'month' | 'last7' | 'last14' | 'last30' | 'custom';

// 请求参数接口
export interface AnalyticsParams {
  time_range?: TimeRange;
  start_date?: string;  // YYYY-MM-DD
  end_date?: string;    // YYYY-MM-DD
}

// 漏斗步骤数据
export interface FunnelStep {
  name: string;
  count: number;
  conversion_rate: number | null;
}

// 漏斗数据
export interface FunnelData {
  steps: FunnelStep[];
  overall_conversion_rate: number;
}

// 指标汇总
export interface MetricSummary {
  uv: number;
  pv: number;
  registrations: number;
  paid_users: number;
  new_paid_users: number;
  repeat_paid_users: number;
  total_revenue: number;
  arpu: number;
}

// 漏斗响应
export interface FunnelResponse {
  code: number;
  data: {
    summary: MetricSummary;
    funnel: FunnelData;
    ga4_configured: boolean;
    date_range: {
      start: string;
      end: string;
    };
  };
}

// 来源分析数据项
export interface SourceBreakdownItem {
  source: string;
  uv: number;
  registrations: number;
  registration_rate: number;
  paid_users: number;
  new_paid_users: number;
  repeat_paid_users: number;
  payment_rate: number;
  revenue: number;
}

// 来源分析响应
export interface SourceBreakdownResponse {
  code: number;
  data: {
    sources: SourceBreakdownItem[];
    date_range: {
      start: string;
      end: string;
    };
  };
}

// 广告 ROI 数据项
export interface CampaignROIItem {
  campaign_name: string;
  spend: number;
  revenue: number;
  roi: number;
  roas: number;
  clicks: number;
  conversions: number;
}

// 广告 ROI 响应
export interface CampaignROIResponse {
  code: number;
  data: {
    campaigns: CampaignROIItem[];
    summary: {
      total_spend: number;
      total_revenue: number;
      overall_roi: number;
      overall_roas: number;
    };
    ads_configured: boolean;
    date_range: {
      start: string;
      end: string;
    };
  };
}

// 趋势数据项
export interface TrendDataItem {
  date: string;
  uv: number;
  registrations: number;
  paid_users: number;
  new_paid_users: number;
  repeat_paid_users: number;
  revenue: number;
}

// 趋势数据响应
export interface TrendResponse {
  code: number;
  data: {
    trend: TrendDataItem[];
    date_range: {
      start: string;
      end: string;
    };
  };
}

// 构建查询字符串
const buildQueryString = (params: AnalyticsParams): string => {
  const searchParams = new URLSearchParams();

  if (params.time_range) {
    searchParams.set('time_range', params.time_range);
  }
  if (params.start_date) {
    searchParams.set('start_date', params.start_date);
  }
  if (params.end_date) {
    searchParams.set('end_date', params.end_date);
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Analytics Service
 */
export const analyticsService = {
  /**
   * 获取漏斗数据
   */
  async getFunnelData(params: AnalyticsParams = {}): Promise<FunnelResponse> {
    const apiUrl = getApiUrl();
    const queryString = buildQueryString(params);
    const response = await fetch(
      `${apiUrl}/api/dashboard/analytics/funnel${queryString}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch funnel data');
    }

    return response.json();
  },

  /**
   * 获取来源分析数据
   */
  async getSourceBreakdown(params: AnalyticsParams = {}): Promise<SourceBreakdownResponse> {
    const apiUrl = getApiUrl();
    const queryString = buildQueryString(params);
    const response = await fetch(
      `${apiUrl}/api/dashboard/analytics/source-breakdown${queryString}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch source breakdown');
    }

    return response.json();
  },

  /**
   * 获取广告 ROI 数据
   */
  async getCampaignROI(params: AnalyticsParams = {}): Promise<CampaignROIResponse> {
    const apiUrl = getApiUrl();
    const queryString = buildQueryString(params);
    const response = await fetch(
      `${apiUrl}/api/dashboard/analytics/campaign-roi${queryString}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch campaign ROI');
    }

    return response.json();
  },

  /**
   * 获取趋势数据
   */
  async getTrendData(params: AnalyticsParams = {}): Promise<TrendResponse> {
    const apiUrl = getApiUrl();
    const queryString = buildQueryString(params);
    const response = await fetch(
      `${apiUrl}/api/dashboard/analytics/trend${queryString}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch trend data');
    }

    return response.json();
  },
};

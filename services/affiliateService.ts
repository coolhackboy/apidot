import { appConfig } from '@/data/config';
import type {
  AffiliateAdminCommissionOrderDetail,
  AffiliateAdminCommissionOrderListParams,
  AffiliateAdminCommissionOrderListResponse,
  AffiliateAdminCommissionStatusPayload,
  AffiliateAdminOverview,
  AffiliateAdminPartnerDetail,
  AffiliateAdminPartnerListParams,
  AffiliateAdminPartnerListResponse,
  AffiliateAdminPartnerStatusPayload,
  AffiliateAdminPartnerWatchlistPayload,
  AffiliateDashboardData,
  AffiliateAdminApplicationListParams,
  AffiliateAdminApplicationListResponse,
  AffiliateAdminReviewPayload,
  AffiliateAdminSettlementDetail,
  AffiliateAdminSettlementListParams,
  AffiliateAdminSettlementListResponse,
  AffiliateAdminSettlementReviewPayload,
  AffiliateAdminSettlementStatusPayload,
  AffiliateApplication,
  AffiliateApplicationPayload,
  AffiliateInviteListParams,
  AffiliateInviteListResponse,
  AffiliateOrderListParams,
  AffiliateOrderListResponse,
  AffiliateProfile,
  AffiliateSettlementListParams,
  AffiliateSettlementListResponse,
  AffiliateSettlementRequestPayload,
  AffiliateSettlementRequestResponse,
} from '@/components/dashboard/affiliate/types';

import { apiService } from './api';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

interface ApiErrorShape {
  message?: string;
  detail?: string;
  error?: {
    message?: string;
  };
}

export interface AffiliateSubmitResponse {
  code?: number;
  message?: string;
  data?: unknown;
}

interface ApiResponse<T> {
  code?: number;
  message?: string;
  data?: T;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = apiService.getAppToken(appConfig.appName);

  if (!token && !apiService.isLoggedInToApp(appConfig.appName)) {
    throw new Error('No authentication token found');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseApiError(response: Response, fallbackMessage: string): Promise<Error> {
  const errorData = (await response.json().catch(() => null)) as ApiErrorShape | null;
  const message =
    errorData?.error?.message || errorData?.message || errorData?.detail || fallbackMessage;
  const error = new Error(message) as Error & { status?: number };
  error.status = response.status;
  return error;
}

async function parseApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    throw await parseApiError(response, fallbackMessage);
  }

  const result = (await response.json().catch(() => null)) as ApiResponse<T> | T | null;

  if (
    result &&
    typeof result === 'object' &&
    'code' in result &&
    typeof result.code === 'number' &&
    ![0, 200].includes(result.code)
  ) {
    throw new Error(result.message || fallbackMessage);
  }

  if (result && typeof result === 'object' && 'data' in result) {
    return (result.data ?? null) as T;
  }

  return result as T;
}

export const affiliateService = {
  async getProfile(): Promise<AffiliateProfile | null> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/affiliate/profile`, {
      method: 'GET',
      headers,
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw await parseApiError(response, 'Failed to fetch affiliate profile');
    }

    const data = await parseApiResponse<AffiliateProfile | null>(response, 'Failed to fetch affiliate profile');

    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return null;
    }

    return data as AffiliateProfile;
  },

  async submitApplication(payload: AffiliateApplicationPayload): Promise<AffiliateSubmitResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/affiliate/applications`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw await parseApiError(response, 'Failed to submit affiliate application');
    }

    const result = (await response.json().catch(() => ({}))) as AffiliateSubmitResponse;

    if (typeof result.code === 'number' && ![0, 200].includes(result.code)) {
      throw new Error(result.message || 'Failed to submit affiliate application');
    }

    return {
      ...result,
      data: result.data,
    };
  },

  async getDashboard(): Promise<AffiliateDashboardData> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/affiliate/dashboard`, {
      method: 'GET',
      headers,
    });

    return parseApiResponse<AffiliateDashboardData>(response, 'Failed to fetch affiliate dashboard');
  },

  async listInvites(params: AffiliateInviteListParams = {}): Promise<AffiliateInviteListResponse> {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set('page', String(params.page));
    if (params.page_size) queryParams.set('page_size', String(params.page_size));
    if (params.keyword) queryParams.set('keyword', params.keyword);

    const response = await fetch(
      `${API_URL}/api/affiliate/invites${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        headers,
      }
    );

    return parseApiResponse<AffiliateInviteListResponse>(response, 'Failed to fetch affiliate invites');
  },

  async listOrders(params: AffiliateOrderListParams = {}): Promise<AffiliateOrderListResponse> {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set('page', String(params.page));
    if (params.page_size) queryParams.set('page_size', String(params.page_size));
    if (params.status) queryParams.set('status', params.status);

    const response = await fetch(
      `${API_URL}/api/affiliate/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        headers,
      }
    );

    return parseApiResponse<AffiliateOrderListResponse>(response, 'Failed to fetch affiliate orders');
  },

  async listSettlements(
    params: AffiliateSettlementListParams = {}
  ): Promise<AffiliateSettlementListResponse> {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set('page', String(params.page));
    if (params.page_size) queryParams.set('page_size', String(params.page_size));
    if (params.status) queryParams.set('status', params.status);

    const response = await fetch(
      `${API_URL}/api/affiliate/settlements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        headers,
      }
    );

    return parseApiResponse<AffiliateSettlementListResponse>(
      response,
      'Failed to fetch affiliate settlements'
    );
  },

  async requestSettlement(
    payload: AffiliateSettlementRequestPayload
  ): Promise<AffiliateSettlementRequestResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/affiliate/settlement-requests`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return parseApiResponse<AffiliateSettlementRequestResponse>(
      response,
      'Failed to submit settlement request'
    );
  },

  async listAdminApplications(
    params: AffiliateAdminApplicationListParams = {}
  ): Promise<AffiliateAdminApplicationListResponse> {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set('page', String(params.page));
    if (params.page_size) queryParams.set('page_size', String(params.page_size));
    if (params.application_status) queryParams.set('application_status', params.application_status);
    if (params.affiliate_status) queryParams.set('affiliate_status', params.affiliate_status);
    if (params.vendor_code) queryParams.set('vendor_code', params.vendor_code);
    if (params.keyword) queryParams.set('keyword', params.keyword);

    const response = await fetch(
      `${API_URL}/api/admin/affiliate/applications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        headers,
      }
    );

    return parseApiResponse<AffiliateAdminApplicationListResponse>(
      response,
      'Failed to fetch affiliate applications'
    );
  },

  async getAdminApplicationDetail(applicationId: number): Promise<AffiliateApplication> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/affiliate/applications/${applicationId}`, {
      method: 'GET',
      headers,
    });

    return parseApiResponse<AffiliateApplication>(
      response,
      'Failed to fetch affiliate application detail'
    );
  },

  async reviewAdminApplication(
    applicationId: number,
    payload: AffiliateAdminReviewPayload
  ): Promise<AffiliateApplication> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_URL}/api/admin/affiliate/applications/${applicationId}/review`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }
    );

    return parseApiResponse<AffiliateApplication>(
      response,
      'Failed to review affiliate application'
    );
  },

  async getAdminOverview(params: { vendor_code?: string } = {}): Promise<AffiliateAdminOverview> {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();

    if (params.vendor_code) queryParams.set('vendor_code', params.vendor_code);

    const response = await fetch(
      `${API_URL}/api/admin/affiliate/overview${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        headers,
      }
    );

    return parseApiResponse<AffiliateAdminOverview>(response, 'Failed to fetch affiliate overview');
  },

  async listAdminCommissionOrders(
    params: AffiliateAdminCommissionOrderListParams = {}
  ): Promise<AffiliateAdminCommissionOrderListResponse> {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set('page', String(params.page));
    if (params.page_size) queryParams.set('page_size', String(params.page_size));
    if (params.stage) queryParams.set('stage', params.stage);
    if (params.keyword) queryParams.set('keyword', params.keyword);
    if (params.vendor_code) queryParams.set('vendor_code', params.vendor_code);

    const response = await fetch(
      `${API_URL}/api/admin/affiliate/commission-orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        headers,
      }
    );

    return parseApiResponse<AffiliateAdminCommissionOrderListResponse>(
      response,
      'Failed to fetch affiliate commission orders'
    );
  },

  async getAdminCommissionOrderDetail(
    commissionId: number
  ): Promise<AffiliateAdminCommissionOrderDetail> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_URL}/api/admin/affiliate/commission-orders/${commissionId}`,
      {
        method: 'GET',
        headers,
      }
    );

    return parseApiResponse<AffiliateAdminCommissionOrderDetail>(
      response,
      'Failed to fetch affiliate commission order detail'
    );
  },

  async updateAdminCommissionOrderStatus(
    commissionId: number,
    payload: AffiliateAdminCommissionStatusPayload
  ): Promise<AffiliateAdminCommissionOrderDetail> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_URL}/api/admin/affiliate/commission-orders/${commissionId}/status`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }
    );

    return parseApiResponse<AffiliateAdminCommissionOrderDetail>(
      response,
      'Failed to update affiliate commission order status'
    );
  },

  async listAdminSettlements(
    params: AffiliateAdminSettlementListParams = {}
  ): Promise<AffiliateAdminSettlementListResponse> {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set('page', String(params.page));
    if (params.page_size) queryParams.set('page_size', String(params.page_size));
    if (params.status) queryParams.set('status', params.status);
    if (params.safety_status) queryParams.set('safety_status', params.safety_status);
    if (params.keyword) queryParams.set('keyword', params.keyword);
    if (params.vendor_code) queryParams.set('vendor_code', params.vendor_code);

    const response = await fetch(
      `${API_URL}/api/admin/affiliate/settlements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        headers,
      }
    );

    return parseApiResponse<AffiliateAdminSettlementListResponse>(
      response,
      'Failed to fetch affiliate settlements'
    );
  },

  async getAdminSettlementDetail(settlementId: number): Promise<AffiliateAdminSettlementDetail> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/affiliate/settlements/${settlementId}`, {
      method: 'GET',
      headers,
    });

    return parseApiResponse<AffiliateAdminSettlementDetail>(
      response,
      'Failed to fetch affiliate settlement detail'
    );
  },

  async reviewAdminSettlement(
    settlementId: number,
    payload: AffiliateAdminSettlementReviewPayload
  ): Promise<AffiliateAdminSettlementDetail> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_URL}/api/admin/affiliate/settlements/${settlementId}/review`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }
    );

    return parseApiResponse<AffiliateAdminSettlementDetail>(
      response,
      'Failed to review affiliate settlement'
    );
  },

  async updateAdminSettlementStatus(
    settlementId: number,
    payload: AffiliateAdminSettlementStatusPayload
  ): Promise<AffiliateAdminSettlementDetail> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_URL}/api/admin/affiliate/settlements/${settlementId}/status`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }
    );

    return parseApiResponse<AffiliateAdminSettlementDetail>(
      response,
      'Failed to update affiliate settlement status'
    );
  },

  async listAdminPartners(
    params: AffiliateAdminPartnerListParams = {}
  ): Promise<AffiliateAdminPartnerListResponse> {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set('page', String(params.page));
    if (params.page_size) queryParams.set('page_size', String(params.page_size));
    if (params.primary_status) queryParams.set('primary_status', params.primary_status);
    if (params.status_tag) queryParams.set('status_tag', params.status_tag);
    if (params.keyword) queryParams.set('keyword', params.keyword);
    if (params.vendor_code) queryParams.set('vendor_code', params.vendor_code);

    const response = await fetch(
      `${API_URL}/api/admin/affiliate/partners${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        headers,
      }
    );

    return parseApiResponse<AffiliateAdminPartnerListResponse>(
      response,
      'Failed to fetch affiliate partners'
    );
  },

  async getAdminPartnerDetail(
    userId: number,
    params: { vendor_code?: string } = {}
  ): Promise<AffiliateAdminPartnerDetail> {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();

    if (params.vendor_code) queryParams.set('vendor_code', params.vendor_code);

    const response = await fetch(
      `${API_URL}/api/admin/affiliate/partners/${userId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        headers,
      }
    );

    return parseApiResponse<AffiliateAdminPartnerDetail>(
      response,
      'Failed to fetch affiliate partner detail'
    );
  },

  async updateAdminPartnerStatus(
    userId: number,
    payload: AffiliateAdminPartnerStatusPayload
  ): Promise<AffiliateAdminPartnerDetail> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/affiliate/partners/${userId}/status`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return parseApiResponse<AffiliateAdminPartnerDetail>(
      response,
      'Failed to update affiliate partner status'
    );
  },

  async updateAdminPartnerWatchlist(
    userId: number,
    payload: AffiliateAdminPartnerWatchlistPayload
  ): Promise<AffiliateAdminPartnerDetail> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/affiliate/partners/${userId}/watchlist`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return parseApiResponse<AffiliateAdminPartnerDetail>(
      response,
      'Failed to update affiliate partner watchlist'
    );
  },
};

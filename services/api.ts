import { appConfig } from "@/data/config";
import { LandingPage } from "@/types/pages/landing";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

const COOKIE_SESSION_KEY = "x-session-id";

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function setCookie(name: string, value: string, days: number = 1) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

interface LoginCredentials {
  username: string;
  password: string;
}

export type AffiliateCodeCheckDetail =
  | 'affiliate_code_invalid'
  | 'affiliate_code_inactive'
  | 'affiliate_code_vendor_mismatch'
  | 'affiliate_code_not_allowed'
  | 'vendor_not_found';

export interface AffiliateCodeCheckData {
  valid: boolean;
  affiliate_code: string;
  promoter_name: string | null;
  vendor_code: string | null;
  reason: AffiliateCodeCheckDetail | null;
  message: string | null;
}

export interface AffiliateCodeCheckResponse {
  code: number;
  data: AffiliateCodeCheckData;
}

interface PlanSubscriptionData {
  plan_code: string;
  frontend_url: string;
  referral_id?: string;
  payment_method?: 'stripe' | 'alipay' | 'wxpay' | 'crypto_btc' | 'crypto_eth' | 'crypto_usdttrc20' | 'paypal';
}

interface ReplicateCreate {
  prompt: string;
  aspect_ratio: string;
  output_format: string;
  raw: boolean;
  safety_tolerance: number;
  seed: number;
  type?: string;
  image1?: string;
  image2?: string;
}

interface GenerateStatusData {
  task_id: string;
  status: string;
  error_message: string;
  credits_amount: number;
  created_time: string;
  files?: Array<{
    file_url: string;
    file_type: string; // image/video/audio
    watermark_url: string; // 无水印图片或视频，如果用户！=free ，那么和 file_url 一样
  }>;
  progress?: number;
}

interface GenerateStatusResponse {
  code: number;
  data: GenerateStatusData;
}

interface GenerateHistoryRequest {
  page: number;
  page_size: number;
  feature_codes: string[];
}


interface GenerateHistoryResponse {
  code: number;
  data: {
    total: number;
    page: number;
    page_size: number;
    items: GenerateStatusData[];
  };
}

// V2 API interfaces
export interface HistoryItemV2 {
  task_id: string;
  status: string;
  error_message: string | null;
  credits_amount: number;
  credits_return?: number;
  input: string; // Raw JSON string
  output: string; // Raw JSON string
  created_time: string;
  finished_time?: string | null;
  model: string; // public_model_id
  uid?: number; // Admin only: user ID
  email?: string; // Admin only: user email
  service_chain?: string[]; // Admin only: 调度链路
  third_party_status?: string; // Admin only: third party status
  progress?: number; // Task progress percentage (0-100)
  retry_count?: number; // Admin only: 调度次数
}

// Task Logs API interfaces
export interface TaskLogItem {
  id: number;
  task_id: string;
  log_type: string;
  log_data: string; // JSON string
  created_time: string;
  updated_time: string;
}

export interface TaskLogsResponse {
  code: number;
  data: {
    total: number;
    page: number;
    page_size: number;
    items: TaskLogItem[];
  };
}

export interface GenerateHistoryV2Request {
  page: number;
  page_size: number;
  task_id?: string; // Optional search parameter
  status?: string; // Optional status filter
  model?: string; // Optional model filter (uses code value)
  uid?: number; // Optional user ID filter (admin only)
  start_time?: string; // Optional created_time lower bound
  end_time?: string; // Optional created_time upper bound
}

// Model list API interfaces
export interface ModelListItem {
  code: string;
  model: string;
}

export interface ModelListResponse {
  code: number;
  data: ModelListItem[];
}

export interface GenerateHistoryV2Response {
  code: number;
  data: {
    total: number;
    page: number;
    page_size: number;
    items: HistoryItemV2[];
  };
}

export interface ManualCallbackResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
    callback_url: string;
    callback_type: string;
    task_status: string;
  };
}

// Admin retry interface
export interface AdminRetryResponse {
  code: number;
  message: string;
  data?: any;
}

// Admin manual fail interfaces
export interface AdminManualFailResult {
  task_id: string;
  status: string;
  previous_status: string;
  refund_status: string;
  refund_amount: number;
}

export interface AdminManualFailResponse {
  code: number;
  data: {
    requested: number;
    updated: number;
    refunded: number;
    results: AdminManualFailResult[];
  };
}

// Chat History API interfaces
export interface ChatHistoryItem {
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  credits_amount: number;
  credits_return: number;
  status: string;
  error_message: string | null;
  created_time: string;
  duration_seconds: number;
}

export interface ChatHistoryRequest {
  page: number;
  page_size: number;
  start_time?: string; // ISO date string, e.g. "2025-01-01T00:00:00"
  end_time?: string; // ISO date string, e.g. "2025-01-31T23:59:59"
}

export interface ChatHistoryResponse {
  code: number;
  data: {
    total: number;
    page: number;
    page_size: number;
    items: ChatHistoryItem[];
  };
}

interface CreditRecordRequest {
  page: number;
  page_size: number;
}

interface CreditData {
  credits_amount: number;
  type: string;
  buy_amount: number;
  buy_source: string;
  created_time: string;
}

interface CreditRecordResponse {
  code: number;
  data: {
    total: number;
    page: number;
    page_size: number;
    items: CreditData[];
  };
}

export interface CreditAlert {
  id?: number;
  threshold: number;
  triggered?: boolean;
  enabled?: boolean;
}

export interface CreditAlertResponse {
  code: number;
  data: CreditAlert[];
}

export interface PaymentRecordRequest {
  page: number;
  page_size: number;
}

export interface PaymentRecordData {
  order_no: string;
  amount: number;
  plan_name: string;
  status: string;
  created_time: string;
  document_kind?: 'receipt' | 'invoice' | null;
  document_status?: 'not_ready' | 'pending' | 'rejected' | 'ready' | null;
  document_action?: 'apply' | 'submitted' | 'reapply' | 'download' | 'edit_info' | null;
  document_url?: string | null;
  document_name?: string | null;
  document_source?: 'payment_receipt' | 'payment_invoice' | null;
}

export interface PaymentRecordResponse {
  code: number;
  data: {
    records: PaymentRecordData[];
    total: number;
    page: number;
    page_size: number;
  };
}

export interface InvoiceProfileData {
  is_company: boolean;
  company_name?: string | null;
  tax_no?: string | null;
  country_region?: string | null;
  postal_code?: string | null;
  state_province?: string | null;
  city?: string | null;
  address?: string | null;
}

export interface InvoiceProfileResponse {
  code: number;
  data: InvoiceProfileData;
}

export interface UpdateInvoiceProfileRequest extends InvoiceProfileData {}

export interface OrderInvoiceData {
  order_no: string;
  invoice_channel: 'wechat' | 'other';
  invoice_status: string;
  invoice_action: 'apply' | 'submitted' | 'reapply' | 'download' | 'edit_info';
  can_download: boolean;
  invoice_url?: string | null;
  invoice_file_name?: string | null;
  snapshot?: Record<string, any> | null;
  reject_reason?: string | null;
  review_remark?: string | null;
}

export interface OrderInvoiceResponse {
  code: number;
  data: OrderInvoiceData;
}

export interface WechatInvoiceApplyRequest {
  invoice_title: string;
  tax_no: string;
  invoice_kind: 'special' | 'normal';
  invoice_item: string;
  remark?: string;
}

export interface AdminWechatInvoiceListItem {
  id: number;
  uid: number;
  order_no: string;
  status: string;
  created_time: string;
  reviewed_at?: string | null;
  issued_at?: string | null;
  reject_reason?: string | null;
  invoice_file_url?: string | null;
}

export interface AdminWechatInvoiceListResponse {
  code: number;
  data: {
    total: number;
    page: number;
    page_size: number;
    items: AdminWechatInvoiceListItem[];
  };
}

export interface AdminWechatInvoiceDetail {
  id: number;
  uid: number;
  vendor_code: string;
  order_no: string;
  payment_record_id: number;
  channel_type: 'wechat';
  status: string;
  snapshot: Record<string, any> | null;
  invoice_file_url?: string | null;
  invoice_file_name?: string | null;
  review_remark?: string | null;
  reject_reason?: string | null;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  issued_at?: string | null;
  created_time: string;
  updated_time: string;
}

export interface AdminWechatInvoiceDetailResponse {
  code: number;
  data: AdminWechatInvoiceDetail;
}

interface BlogCategoryItem {
  id: number;
  name: string;
  count: number;
}

interface CheckRunningTasksResponse {
  code: number;
  data: {
    [key: string]: boolean;
  };
}

// Dashboard API Usage interfaces
export interface DashboardSpendParams {
  time_range: 'week' | 'month' | 'last7' | 'last14' | 'last30' | 'custom';
  start_date?: string;
  end_date?: string;
}

export interface TimeSeriesItem {
  date: string;
  credits: number;
}

export interface TotalSpendResponse {
  code: number;
  data: {
    total_credits: number;
    time_series: TimeSeriesItem[];
  };
}

export interface ModelSpendItem {
  model_name: string;
  total_credits: number;
  time_series: TimeSeriesItem[];
}

export interface ModelSpendResponse {
  code: number;
  data: {
    models: ModelSpendItem[];
    total_credits: number;
  };
}

export interface KeySpendItem {
  api_key_id: number;
  api_key: string;
  api_key_name: string;
  total_credits: number;
  time_series: TimeSeriesItem[];
}

export interface KeySpendResponse {
  code: number;
  data: {
    keys: KeySpendItem[];
    total_credits: number;
  };
}

interface EmailRequest {
  to: string[];
  subject: string;
  html: string;
}

interface EmailResponse {
  code: number;
  data: {
    id: string;
    message: string;
  };
}

interface UserQueryRequest {
  vendor_codes?: string[];
  is_paid?: boolean;
  start_date?: string;
  end_date?: string;
  has_consumed?: boolean;
}

interface UserQueryResponse {
  code: number;
  data: {
    email_list: string[];
  };
}

// Auto Recharge Types
export interface AutoRechargeConfigData {
  enabled: boolean;
  threshold_credits: number;
  recharge_plan_code: string;
  has_payment_method: boolean;
  payment_method_last4: string | null;
  payment_method_brand: string | null;
  last_recharge_time: string | null;
  last_recharge_status: string | null;
  billing_info_complete: boolean;
}

export interface AutoRechargeConfigResponse {
  code: number;
  data: AutoRechargeConfigData;
}

export interface UpdateAutoRechargeConfig {
  enabled: boolean;
  threshold_credits: number;
  recharge_plan_code: string;
}

export interface SetupIntentResponse {
  code: number;
  data: {
    client_secret: string;
    setup_intent_id: string;
  };
}

// 缓存设备指纹，避免重复调用 FingerprintJS
let cachedFingerprint: string | null = null;

async function getDeviceFingerprint(): Promise<string> {
  // 如果有缓存，直接返回
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      if (result.visitorId) {
        cachedFingerprint = result.visitorId;
        return result.visitorId;
      }
    } catch (error) {
      console.error(`Fingerprint attempt ${i + 1} failed:`, error);
      // 等待一小段时间后重试
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
      }
    }
  }

  throw new Error("Unable to initialize device security. Please refresh the page and try again.");
}

async function getDefaultHeaders(
  token: string | null | undefined
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const sessionId = apiService.getSeessionId();
  if (sessionId) {
    headers["x-session-id"] = sessionId;
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 设备指纹现在是必需的，获取失败会抛出错误
  const fingerprint = await getDeviceFingerprint();
  headers["x-device-fingerprint"] = fingerprint;

  return headers;
}

type ApiRequestError = Error & {
  status?: number;
  detail?: string;
};

export const apiService = {
  getSeessionId(): string | null {
    let sessionId = getCookie(COOKIE_SESSION_KEY);
    if (!sessionId) {
      sessionId = generateSessionId();
      this.setSessionId(sessionId);
    }
    return sessionId;
  },

  setSessionId(sessionId: string) {
    setCookie(COOKIE_SESSION_KEY, sessionId);
  },

  async loginWithEmail(credentials: LoginCredentials, slug: string) {
    const headers = await getDefaultHeaders(undefined);
    const response = await fetch("/api/user/login/email", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ ...credentials, slug }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || error.message || "Login failed");
    }

    return response.json();
  },

  async checkAffiliateCode(
    params: {
      affiliate_code: string;
      slug: string;
    },
    options: { signal?: AbortSignal } = {}
  ): Promise<AffiliateCodeCheckResponse> {
    const headers = await getDefaultHeaders(undefined);
    const queryParams = new URLSearchParams({
      affiliate_code: params.affiliate_code,
      slug: params.slug,
    });
    const response = await fetch(`/api/user/check-affiliate-code?${queryParams.toString()}`, {
      method: "GET",
      headers,
      signal: options.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const requestError = new Error(
        errorData?.error?.message ||
          errorData?.message ||
          errorData?.detail ||
          "Failed to check affiliate code"
      ) as ApiRequestError;
      requestError.status = response.status;
      requestError.detail = errorData?.detail;
      throw requestError;
    }

    const result = await response.json().catch(() => null);

    if (
      !result ||
      typeof result !== "object" ||
      result.code !== 200 ||
      !("data" in result) ||
      !result.data ||
      typeof result.data !== "object" ||
      typeof (result.data as AffiliateCodeCheckData).valid !== "boolean"
    ) {
      throw new Error("Invalid affiliate code validation response");
    }

    return result as AffiliateCodeCheckResponse;
  },
  async loginWithGoogle(
    id_token: string,
    slug: string,
    source?: string,
    internal_source?: string,
    affiliate_code?: string,
    utmData?: {
      first_utm_source?: string;
      first_utm_campaign?: string;
      first_utm_medium?: string;
      registration_page?: string;
    }
  ) {
    const headers = await getDefaultHeaders(undefined);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${apiUrl}/api/user/login/google`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ id_token, slug, source, internal_source, affiliate_code, ...utmData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || error.message || error.detail || "Google login failed");
    }

    return response.json();
  },

  // ==================== 邮箱验证码相关 ====================

  /**
   * 发送验证码
   */
  async sendVerificationCode(
    email: string,
    type: 'register' | 'reset_password',
    slug: string
  ) {
    const headers = await getDefaultHeaders(undefined);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${apiUrl}/api/user/send-verification-code`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ email, type, slug }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || error.detail || "Failed to send verification code");
    }

    return response.json();
  },

  /**
   * 使用邮箱注册
   */
  async registerWithEmail(data: {
    email: string;
    password: string;
    verification_code: string;
    user_name: string;
    slug: string;
    affiliate_code?: string;
    source?: string;
    internal_source?: string;
    // UTM 参数用于转化率分析
    first_utm_source?: string;
    first_utm_campaign?: string;
    first_utm_medium?: string;
    registration_page?: string;
  }) {
    const headers = await getDefaultHeaders(undefined);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${apiUrl}/api/user/register-with-email`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || error.detail || "Registration failed");
    }

    return response.json();
  },

  /**
   * 忘记密码 - 发送验证码
   */
  async forgotPassword(email: string, slug: string) {
    const headers = await getDefaultHeaders(undefined);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${apiUrl}/api/user/forgot-password`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ email, slug }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || error.detail || "Failed to send reset code");
    }

    return response.json();
  },

  /**
   * 重置密码
   */
  async resetPassword(data: {
    email: string;
    verification_code: string;
    new_password: string;
    slug: string;
  }) {
    const headers = await getDefaultHeaders(undefined);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${apiUrl}/api/user/reset-password`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || error.detail || "Password reset failed");
    }

    return response.json();
  },

  /**
   * GitHub 登录
   */
  async loginWithGitHub(
    code: string,
    slug: string,
    source?: string,
    internal_source?: string,
    affiliate_code?: string
  ) {
    const headers = await getDefaultHeaders(undefined);
    const response = await fetch(`/api/user/login/github`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ code, slug, source, internal_source, affiliate_code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || error.detail || "GitHub login failed");
    }

    return response.json();
  },

  async getUserInfo(appName: string) {
    const token = localStorage.getItem(`${appName}_token`);
    if (!token) {
      const requestError = new Error("No token found") as ApiRequestError;
      requestError.status = 401;
      throw requestError;
    }

    const response = await fetch("/api/user/info", {
      headers: await getDefaultHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      const requestError = new Error(error?.message || "Failed to get user info") as ApiRequestError;
      requestError.status = response.status;
      throw requestError;
    }

    return response.json();
  },

  async deductCredits(
    credits_amount: number,
    generation_type: string,
    model: string
  ) {
    const token = this.getAppToken(appConfig.appName);

    const response = await fetch("/api/credits/deduct-v2", {
      method: "POST",
      headers: await getDefaultHeaders(token),
      body: JSON.stringify({
        credits_amount: credits_amount,
        generate_type: generation_type,
        model: model,
        type: "usage_cost",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to deduct credits");
    }

    return response.json();
  },



  getAppToken(appName: string) {
    return localStorage.getItem(`${appName}_token`);
  },

  isLoggedInToApp(appName: string) {
    return !!this.getAppToken(appName);
  },

  logout(appName: string) {
    localStorage.removeItem(`${appName}_token`);
    localStorage.removeItem(`${appName}_googleAccessToken`);
    window.location.href = appConfig.logoutRedirectUrl || "/";
  },

  async getVendorInfo(appName: string) {
    const response = await fetch("/api/vendor?slug=" + appName, {
      method: "GET",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get vendor info");
    }

    return response.json();
  },

  async createCheckoutSession(data: PlanSubscriptionData, appName: string) {
    const token = this.getAppToken(appName);
    const response = await fetch("/api/payment/create-checkout-session", {
      method: "POST",
      headers: await getDefaultHeaders(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create checkout session");
    }

    return response.json();
  },

  async checkPaymentStatus(orderNo: string, appName: string) {
    const token = this.getAppToken(appName);
    const response = await fetch(
      `/api/payment/check-payment-status/${orderNo}`,
      {
        method: "GET",
        headers: await getDefaultHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to check payment status");
    }

    return response.json();
  },

  async getPaymentRecords(
    req: PaymentRecordRequest
  ): Promise<PaymentRecordResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch(
      `/api/payment/records?page=${req.page}&page_size=${req.page_size}`,
      {
        method: "GET",
        headers: await getDefaultHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get payment records");
    }

    return response.json();
  },

  async getInvoiceProfile(): Promise<InvoiceProfileResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch("/api/invoice/profile", {
      method: "GET",
      headers: await getDefaultHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get invoice profile");
    }

    return response.json();
  },

  async updateInvoiceProfile(
    payload: UpdateInvoiceProfileRequest
  ): Promise<InvoiceProfileResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch("/api/invoice/profile", {
      method: "PUT",
      headers: await getDefaultHeaders(token),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update invoice profile");
    }

    return response.json();
  },

  async getOrderInvoice(orderNo: string): Promise<OrderInvoiceResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch(`/api/invoice/orders/${orderNo}`, {
      method: "GET",
      headers: await getDefaultHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get order invoice");
    }

    return response.json();
  },

  async applyWechatInvoice(
    orderNo: string,
    payload: WechatInvoiceApplyRequest
  ): Promise<OrderInvoiceResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch(`/api/invoice/wechat/orders/${orderNo}/apply`, {
      method: "POST",
      headers: await getDefaultHeaders(token),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to apply wechat invoice");
    }

    return response.json();
  },

  async generateOtherInvoice(
    orderNo: string,
    payload?: UpdateInvoiceProfileRequest
  ): Promise<OrderInvoiceResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch(`/api/invoice/other/orders/${orderNo}/generate`, {
      method: "POST",
      headers: await getDefaultHeaders(token),
      body: payload ? JSON.stringify(payload) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to generate invoice");
    }

    return response.json();
  },

  async getAdminWechatInvoices(params: {
    page?: number;
    page_size?: number;
    status?: string;
    uid?: number;
    order_no?: string;
  }): Promise<AdminWechatInvoiceListResponse> {
    const token = this.getAppToken(appConfig.appName);
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.page_size) query.set("page_size", String(params.page_size));
    if (params.status) query.set("status", params.status);
    if (typeof params.uid === "number") query.set("uid", String(params.uid));
    if (params.order_no) query.set("order_no", params.order_no);

    const response = await fetch(`/api/admin/invoices/wechat?${query.toString()}`, {
      method: "GET",
      headers: await getDefaultHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get wechat invoice list");
    }

    return response.json();
  },

  async getAdminWechatInvoiceDetail(
    invoiceId: number
  ): Promise<AdminWechatInvoiceDetailResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch(`/api/admin/invoices/wechat/${invoiceId}`, {
      method: "GET",
      headers: await getDefaultHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get wechat invoice detail");
    }

    return response.json();
  },

  async rejectAdminWechatInvoice(
    invoiceId: number,
    rejectReason: string
  ): Promise<AdminWechatInvoiceDetailResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch(`/api/admin/invoices/wechat/${invoiceId}/reject`, {
      method: "POST",
      headers: await getDefaultHeaders(token),
      body: JSON.stringify({ reject_reason: rejectReason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to reject wechat invoice");
    }

    return response.json();
  },

  async issueAdminWechatInvoice(
    invoiceId: number,
    file: File
  ): Promise<AdminWechatInvoiceDetailResponse> {
    const token = this.getAppToken(appConfig.appName);
    const headers = await getDefaultHeaders(token);
    delete headers["Content-Type"];

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/admin/invoices/wechat/${invoiceId}/issue`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to issue wechat invoice");
    }

    return response.json();
  },

  async post(url: string, data: any, appName?: string) {
    const token = appName ? this.getAppToken(appName) : undefined;
    const response = await fetch(url, {
      method: "POST",
      headers: await getDefaultHeaders(token),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async get(url: string, appName?: string) {
    const token = appName ? this.getAppToken(appName) : undefined;
    const response = await fetch(url, {
      headers: await getDefaultHeaders(token),
    });

    const data = await response.json();

    // Track first-time playground use when any generation task finishes
    if (
      (url.includes('/api/generate/status/') || url.includes('/api/generate/detail/')) &&
      data?.data?.status === 'finished'
    ) {
      try {
        const { trackPlaygroundUse } = await import('@/utils/gtm-events');
        trackPlaygroundUse();
      } catch (_) {
        // Tracking should never break app functionality
      }
    }

    return data;
  },

  async create(req: ReplicateCreate) {
    const response = await fetch("/api/generate/replicate/create", {
      method: "POST",
      headers: await getDefaultHeaders(undefined),
      body: JSON.stringify(req),
    });

    console.log("ReplicateCreate response", response);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Create failed");
    }

    return response.json();
  },

  async deleteGeneration(taskId: string) {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch(`/api/generate/delete/${taskId}`, {
      method: "POST",
      headers: await getDefaultHeaders(token),
    });
  },

  async getCreditsRecord(
    req: CreditRecordRequest
  ): Promise<CreditRecordResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch(
      `/api/credits/records?page=${req.page}&page_size=${req.page_size}`,
      {
        method: "GET",
        headers: await getDefaultHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get credit records");
    }

    return response.json();
  },

  async getStatus(taskId: string): Promise<GenerateStatusResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch(`/api/generate/status/${taskId}`, {
      method: "GET",
      headers: await getDefaultHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get status");
    }

    return response.json();
  },

  async getHistory(
    req: GenerateHistoryRequest
  ): Promise<GenerateHistoryResponse> {
    const token = this.getAppToken(appConfig.appName);
    const featureCodesParam = JSON.stringify(req.feature_codes);
    const response = await fetch(
      `/api/generate/history?page=${req.page}&page_size=${
        req.page_size
      }&feature_codes=${encodeURIComponent(featureCodesParam)}`,
      {
        method: "GET",
        headers: await getDefaultHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get history");
    }

    return response.json();
  },

  async getHistoryV2(
    req: GenerateHistoryV2Request
  ): Promise<GenerateHistoryV2Response> {
    const token = this.getAppToken(appConfig.appName);
    const params = new URLSearchParams({
      page: req.page.toString(),
      page_size: req.page_size.toString(),
    });

    if (req.task_id) {
      params.append("task_id", req.task_id);
    }
    if (req.status && req.status !== "all") {
      params.append("status", req.status);
    }
    if (req.model && req.model !== "all") {
      params.append("model", req.model);
    }
    if (req.uid) {
      params.append("uid", req.uid.toString());
    }

    // 直接调用后端 API，绕过 Next.js 代理
    if (req.start_time) {
      params.append("start_time", req.start_time);
    }
    if (req.end_time) {
      params.append("end_time", req.end_time);
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(
      `${apiUrl}/api/generate/history/v2?${params.toString()}`,
      {
        method: "GET",
        headers: await getDefaultHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get history");
    }

    return response.json();
  },

  // Get chat history
  async getChatHistory(
    req: ChatHistoryRequest
  ): Promise<ChatHistoryResponse> {
    const token = this.getAppToken(appConfig.appName);
    const params = new URLSearchParams({
      page: req.page.toString(),
      page_size: req.page_size.toString(),
    });

    if (req.start_time) {
      params.append("start_time", req.start_time);
    }
    if (req.end_time) {
      params.append("end_time", req.end_time);
    }

    // Direct backend API call, same pattern as getHistoryV2
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(
      `${apiUrl}/api/chat/history?${params.toString()}`,
      {
        method: "GET",
        headers: await getDefaultHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get chat history");
    }

    return response.json();
  },

  // Get model list for filter dropdown
  async getModelList(): Promise<ModelListResponse> {
    const token = this.getAppToken(appConfig.appName);
    // 直接调用后端 API，绕过 Next.js 代理
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${apiUrl}/api/generate/model_list`, {
      method: "GET",
      headers: await getDefaultHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get model list");
    }

    return response.json();
  },

  // Get task logs
  async getTaskLogs(
    taskId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<TaskLogsResponse> {
    const token = this.getAppToken(appConfig.appName);
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("page_size", pageSize.toString());

    const response = await fetch(
      `/api/generate/logs/${taskId}?${params.toString()}`,
      {
        method: "GET",
        headers: await getDefaultHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get task logs");
    }

    return response.json();
  },

    // 检查运行中的任务
    async check_running_tasks(
      feature_codes: string[]
    ): Promise<CheckRunningTasksResponse> {
      const featureCodesParam = JSON.stringify(feature_codes);
      const response = await apiService.get(
        "/api/generate/check_running_tasks?feature_codes=" +
          encodeURIComponent(featureCodesParam),
        appConfig.appName
      );
      return response;
    },

  async download(taskId: string, index: number) {
    const token = localStorage.getItem(`${appConfig.appName}_token`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      `/api/generate/download_file/${taskId}?index=${index}`,
      {
        method: "GET",
        headers: headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    // Return the blob data and filename from Content-Disposition header
    const blob = await response.blob();
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = `video_${taskId}.mp4`; // default filename

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename=([^;]+)/);
      if (filenameMatch) {
        filename = filenameMatch[1].replace(/"/g, ""); // remove quotes
      }
    }

    return { blob, filename };
  },

  // Dashboard API Usage Methods
  async getTotalSpend(params: DashboardSpendParams): Promise<TotalSpendResponse> {
    const token = this.getAppToken(appConfig.appName);
    const queryParams = new URLSearchParams({
      time_range: params.time_range,
    });
    if (params.start_date) queryParams.append("start_date", params.start_date);
    if (params.end_date) queryParams.append("end_date", params.end_date);

    const response = await fetch(
      `/api/dashboard/total-spend?${queryParams.toString()}`,
      {
        method: "GET",
        headers: await getDefaultHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get total spend");
    }

    return response.json();
  },

  async getModelSpend(params: DashboardSpendParams & { top?: number }): Promise<ModelSpendResponse> {
    const token = this.getAppToken(appConfig.appName);
    const queryParams = new URLSearchParams({
      time_range: params.time_range,
    });
    if (params.start_date) queryParams.append("start_date", params.start_date);
    if (params.end_date) queryParams.append("end_date", params.end_date);
    if (params.top) queryParams.append("top", params.top.toString());

    const response = await fetch(
      `/api/dashboard/model-spend?${queryParams.toString()}`,
      {
        method: "GET",
        headers: await getDefaultHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get model spend");
    }

    return response.json();
  },

  async getKeySpend(params: DashboardSpendParams): Promise<KeySpendResponse> {
    const token = this.getAppToken(appConfig.appName);
    const queryParams = new URLSearchParams({
      time_range: params.time_range,
    });
    if (params.start_date) queryParams.append("start_date", params.start_date);
    if (params.end_date) queryParams.append("end_date", params.end_date);

    const response = await fetch(
      `/api/dashboard/key-spend?${queryParams.toString()}`,
      {
        method: "GET",
        headers: await getDefaultHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get key spend");
    }

    return response.json();
  },

  async triggerManualCallback(taskId: string): Promise<ManualCallbackResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch(`/api/generate/callback/manual/${taskId}`, {
      method: "POST",
      headers: await getDefaultHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to trigger manual callback");
    }

    return response.json();
  },

  async sendEmail(emailData: EmailRequest): Promise<EmailResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch('/api/common/send-email', {
      method: 'POST',
      headers: await getDefaultHeaders(token),
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send email");
    }

    return response.json();
  },

  async queryUsers(queryData: UserQueryRequest): Promise<UserQueryResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch('/api/user/query_users', {
      method: 'POST',
      headers: await getDefaultHeaders(token),
      body: JSON.stringify(queryData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to query users");
    }

    return response.json();
  },

  async adminRetryTasks(taskIds: string[]): Promise<AdminRetryResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch("/api/admin/generate/retry", {
      method: "POST",
      headers: await getDefaultHeaders(token),
      body: JSON.stringify({ task_ids: taskIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to retry tasks");
    }

    return response.json();
  },

  async adminManualFailTasks(
    taskIds: string[],
    errorMessage: string
  ): Promise<AdminManualFailResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch("/api/generate/admin/manual_fail", {
      method: "POST",
      headers: await getDefaultHeaders(token),
      body: JSON.stringify({ task_ids: taskIds, error_message: errorMessage }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to manually fail tasks");
    }

    return response.json();
  },

  // Auto Recharge API Methods
  async getAutoRechargeConfig(): Promise<AutoRechargeConfigResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch("/api/payment/auto-recharge/config", {
      method: "GET",
      headers: await getDefaultHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get auto recharge config");
    }

    return response.json();
  },

  async updateAutoRechargeConfig(config: UpdateAutoRechargeConfig): Promise<AutoRechargeConfigResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch("/api/payment/auto-recharge/config", {
      method: "POST",
      headers: await getDefaultHeaders(token),
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update auto recharge config");
    }

    return response.json();
  },

  async createSetupIntent(): Promise<SetupIntentResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch("/api/payment/auto-recharge/setup-intent", {
      method: "POST",
      headers: await getDefaultHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create setup intent");
    }

    return response.json();
  },

  async confirmPaymentMethod(
    paymentMethodId: string,
    billingName: string,
    billingCountry: string
  ): Promise<AutoRechargeConfigResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch("/api/payment/auto-recharge/confirm-payment-method", {
      method: "POST",
      headers: await getDefaultHeaders(token),
      body: JSON.stringify({
        payment_method_id: paymentMethodId,
        billing_name: billingName,
        billing_country: billingCountry,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to confirm payment method");
    }

    return response.json();
  },

  async removePaymentMethod(): Promise<{ code: number; data: { message: string } }> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch("/api/payment/auto-recharge/payment-method", {
      method: "DELETE",
      headers: await getDefaultHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to remove payment method");
    }

    return response.json();
  },

  // Credit Alert API Methods
  async getCreditAlerts(): Promise<CreditAlertResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch("/api/user/credit-alerts", {
      method: "GET",
      headers: await getDefaultHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get credit alerts");
    }

    return response.json();
  },

  async saveCreditAlerts(alerts: { threshold: number }[]): Promise<CreditAlertResponse> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch("/api/user/credit-alerts", {
      method: "POST",
      headers: await getDefaultHeaders(token),
      body: JSON.stringify({ alerts }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to save credit alerts");
    }

    return response.json();
  },

  async deleteCreditAlert(id: number): Promise<{ code: number; data: { message: string } }> {
    const token = this.getAppToken(appConfig.appName);
    const response = await fetch(`/api/user/credit-alerts/${id}`, {
      method: "DELETE",
      headers: await getDefaultHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to delete credit alert");
    }

    return response.json();
  },
};

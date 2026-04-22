export type AffiliateProgramStatus = 'not_applied' | 'pending' | 'approved' | 'rejected' | 'suspended' | 'banned';

export type AffiliateChannel = 'youtube' | 'x' | 'tiktok' | 'blog' | 'community' | 'other';
export type AffiliateApplicationChannelType =
  | 'youtube'
  | 'x'
  | 'tiktok'
  | 'instagram'
  | 'blog'
  | 'discord'
  | 'newsletter'
  | 'other';
export type AffiliateApplicationStatus = 'submitted' | 'approved' | 'rejected';
export type AffiliateStatus = 'inactive' | 'active' | 'suspended' | 'banned';
export type AffiliatePrimaryStatus = AffiliateStatus;
export type AffiliateStatusTag = 'new_joined' | 'watchlist';
export type AffiliateReviewAction = 'approve' | 'reject';
export type AffiliateProfileApplicationStatus = AffiliateApplicationStatus;
export type AffiliateLinkStatus = 'locked' | 'active';
export type AffiliateInviteStatus = 'registered' | 'converted' | 'high_value';
export type AffiliateUserOrderStatus = 'pending_hold' | 'available' | 'locked' | 'paid' | 'reversed';
export type AffiliateSettlementStatus = 'submitted' | 'processing' | 'paid' | 'rejected' | 'cancelled';
export type AffiliateSettlementMethod = 'stripe' | 'wechat';
export type AffiliateSettlementCycle = 'monthly';
export type AffiliateAdminCommissionStage =
  | 'hold'
  | 'releasable'
  | 'locked'
  | 'risk_frozen'
  | 'paid'
  | 'reversed';
export type AffiliateAdminSettlementStatus =
  | 'submitted'
  | 'approved'
  | 'processing'
  | 'paid'
  | 'rejected'
  | 'cancelled';
export type AffiliateAdminSettlementSafetyStatus =
  | 'pending'
  | 'passed'
  | 'manual_review'
  | 'blocked';
export type AffiliateAdminSettlementReviewAction =
  | 'approve'
  | 'reject'
  | 'manual_review'
  | 'block';
export type AffiliateAdminSettlementProcessAction = 'mark_processing' | 'mark_paid';

export interface AffiliateDashboardCards {
  total_earned: string;
  pending_settlement: string;
  withdrawable_amount: string;
  paid_amount: string;
}

export interface AffiliateDashboardData {
  can_apply: boolean;
  application_status?: AffiliateProfileApplicationStatus | null;
  affiliate_status?: AffiliateStatus | null;
  review_note?: string | null;
  link_status: AffiliateLinkStatus;
  invite_code?: string | null;
  share_url?: string | null;
  share_copy_text?: string | null;
  cards: AffiliateDashboardCards;
}

export interface AffiliateInviteItem {
  invite_id: number;
  invitee_email_masked: string;
  bound_at: string;
  status: AffiliateInviteStatus;
  commission_total: string;
}

export interface AffiliateInviteListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
}

export interface AffiliateInviteListResponse {
  total: number;
  page: number;
  page_size: number;
  items: AffiliateInviteItem[];
}

export interface AffiliateOrderItem {
  commission_id: number;
  order_no: string | null;
  invitee_email_masked: string;
  payment_amount: string;
  commission_amount: string;
  payment_completed_at: string;
  status: AffiliateUserOrderStatus;
}

export interface AffiliateOrderListParams {
  page?: number;
  page_size?: number;
  status?: AffiliateUserOrderStatus;
}

export interface AffiliateOrderListResponse {
  total: number;
  page: number;
  page_size: number;
  items: AffiliateOrderItem[];
}

export interface AffiliateSettlementSummary {
  withdrawable_amount: string;
  min_withdraw_amount: string;
  settlement_cycle: AffiliateSettlementCycle;
  supported_methods: AffiliateSettlementMethod[];
  default_method: AffiliateSettlementMethod;
  button_enabled: boolean;
  button_disabled_reason: string | null;
}

export interface AffiliateSettlementItem {
  settlement_request_id: number;
  request_no: string;
  requested_amount: string;
  approved_amount: string | null;
  paid_amount: string | null;
  method: AffiliateSettlementMethod;
  applied_at: string;
  status: AffiliateSettlementStatus;
}

export interface AffiliateSettlementListParams {
  page?: number;
  page_size?: number;
  status?: AffiliateSettlementStatus;
}

export interface AffiliateSettlementListResponse {
  summary: AffiliateSettlementSummary;
  total: number;
  page: number;
  page_size: number;
  items: AffiliateSettlementItem[];
}

export interface AffiliateSettlementRequestPayload {
  method: AffiliateSettlementMethod;
  destination_account: string;
}

export interface AffiliateSettlementRequestResponse {
  settlement_request_id: number;
  request_no: string;
  requested_amount: string;
  method: AffiliateSettlementMethod;
  destination_account_masked: string;
  status: 'submitted';
  created_at: string;
}

export interface AffiliateApplicationDraft {
  channelTypes: AffiliateApplicationChannelType[];
  accountLinks: string[];
  proofImageUrl: string;
  proofImageName: string;
  proofImageSize: number;
  promotionPlan: string;
  contactInfo: string;
  additionalNotes: string;
}

export interface AffiliateApplicationPayload {
  channel_types: AffiliateApplicationChannelType[];
  account_links: string[];
  proof_image_url: string;
  proof_image_name: string;
  proof_image_size: number;
  promotion_plan: string;
  contact_info: string;
  additional_notes: string;
}

export interface AffiliateApplication {
  id: number;
  application_no: string;
  user_id: number;
  user_email_snapshot: string;
  vendor_code: string;
  application_status: AffiliateApplicationStatus;
  affiliate_status: AffiliateStatus;
  primary_status?: AffiliatePrimaryStatus;
  status_tags?: AffiliateStatusTag[];
  manual_rate_bps: number | null;
  channel_types: AffiliateApplicationChannelType[];
  account_links: string[];
  proof_image_url: string | null;
  proof_image_name: string | null;
  proof_image_size: number | null;
  promotion_plan: string | null;
  contact_info: string | null;
  additional_notes: string | null;
  review_note: string | null;
  reviewed_by_uid: number | null;
  reviewed_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  is_watchlist?: boolean;
  watchlist_note?: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface AffiliateProfileData {
  can_apply: boolean;
  application_status?: AffiliateProfileApplicationStatus | null;
  affiliate_status?: AffiliateStatus | null;
  review_note?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  approved_at?: string | null;
  current_application?: AffiliateApplication | null;
}

export type AffiliateProfile = AffiliateProfileData;

export interface AffiliateAdminApplicationListParams {
  page?: number;
  page_size?: number;
  application_status?: AffiliateApplicationStatus;
  affiliate_status?: AffiliateStatus;
  vendor_code?: string;
  keyword?: string;
}

export interface AffiliateAdminApplicationListResponse {
  total: number;
  page: number;
  page_size: number;
  items: AffiliateApplication[];
}

export interface AffiliateAdminReviewPayload {
  action: AffiliateReviewAction;
  review_note?: string;
  manual_rate_bps?: number;
}

export interface AffiliateAdminOverview {
  pending_application_count: number;
  releasable_commission_amount: string;
  releasable_commission_count: number;
  pending_payout_amount: string;
  pending_payout_count: number;
}

export interface AffiliateAdminCommissionOrderItem {
  commission_id: number;
  order_no: string | null;
  promoter_user_id: number;
  promoter_name: string | null;
  promoter_email: string | null;
  invite_code: string | null;
  invitee_email: string;
  payment_amount: string;
  commission_amount: string;
  db_status: string;
  stage: AffiliateAdminCommissionStage;
  releasable_at: string;
  payment_completed_at: string;
}

export interface AffiliateAdminCommissionOrderDetail extends AffiliateAdminCommissionOrderItem {
  transaction_id: string | null;
  payment_method: string;
  status_reason: string | null;
  invite_id: number;
  settlement_request_id: number | null;
}

export interface AffiliateAdminCommissionOrderListParams {
  page?: number;
  page_size?: number;
  stage?: AffiliateAdminCommissionStage;
  keyword?: string;
  vendor_code?: string;
}

export interface AffiliateAdminCommissionOrderListResponse {
  total: number;
  page: number;
  page_size: number;
  items: AffiliateAdminCommissionOrderItem[];
}

export type AffiliateAdminCommissionStatusAction = 'unfreeze' | 'reverse';

export interface AffiliateAdminCommissionStatusPayload {
  action: AffiliateAdminCommissionStatusAction;
  reason: string;
}

export interface AffiliateAdminSettlementProofItem {
  url: string;
  name?: string | null;
}

export interface AffiliateAdminSettlementProof {
  proof_type?: string | null;
  proof_items?: AffiliateAdminSettlementProofItem[] | null;
  operator_note?: string | null;
  [key: string]: unknown;
}

export interface AffiliateAdminSettlementItem {
  settlement_request_id: number;
  request_no: string;
  promoter_user_id: number;
  promoter_name: string | null;
  promoter_email: string | null;
  requested_amount: string;
  approved_amount: string | null;
  paid_amount: string | null;
  method: AffiliateSettlementMethod;
  destination_account_masked: string | null;
  safety_status: AffiliateAdminSettlementSafetyStatus;
  status: AffiliateAdminSettlementStatus;
  applied_at: string;
}

export interface AffiliateAdminSettlementDetail extends AffiliateAdminSettlementItem {
  destination_account: string | null;
  available_balance_snapshot: string | null;
  process_note: string | null;
  proof_json: AffiliateAdminSettlementProof | null;
  reviewed_by_uid: number | null;
  reviewed_at: string | null;
  paid_by_uid: number | null;
  paid_at: string | null;
  reject_reason: string | null;
}

export interface AffiliateAdminSettlementListParams {
  page?: number;
  page_size?: number;
  status?: AffiliateAdminSettlementStatus;
  safety_status?: AffiliateAdminSettlementSafetyStatus;
  keyword?: string;
  vendor_code?: string;
}

export interface AffiliateAdminSettlementListResponse {
  total: number;
  page: number;
  page_size: number;
  items: AffiliateAdminSettlementItem[];
}

export interface AffiliateAdminSettlementReviewPayload {
  action: AffiliateAdminSettlementReviewAction;
  review_note?: string;
  approved_amount?: string;
}

export interface AffiliateAdminSettlementStatusPayload {
  action: AffiliateAdminSettlementProcessAction;
  process_note?: string;
  proof_json?: AffiliateAdminSettlementProof;
}

export interface AffiliateAdminPartnerItem {
  promoter_user_id: number;
  promoter_name: string | null;
  promoter_email: string | null;
  invite_code: string | null;
  invite_count: number;
  total_commission: string;
  primary_status: AffiliatePrimaryStatus;
  status_tags: AffiliateStatusTag[];
}

export interface AffiliateAdminPartnerDetail extends AffiliateAdminPartnerItem {
  share_url: string | null;
  latest_application: AffiliateApplication | null;
  preferred_settlement_method: AffiliateSettlementMethod;
  preferred_destination_account_masked: string | null;
}

export type AffiliateAdminPartnerManagedStatus = 'active' | 'suspended' | 'banned';

export interface AffiliateAdminPartnerStatusPayload {
  affiliate_status: AffiliateAdminPartnerManagedStatus;
}

export interface AffiliateAdminPartnerWatchlistPayload {
  is_watchlist: boolean;
  watchlist_note?: string | null;
}

export interface AffiliateAdminPartnerListParams {
  page?: number;
  page_size?: number;
  primary_status?: AffiliatePrimaryStatus;
  status_tag?: AffiliateStatusTag;
  keyword?: string;
  vendor_code?: string;
}

export interface AffiliateAdminPartnerListResponse {
  total: number;
  page: number;
  page_size: number;
  items: AffiliateAdminPartnerItem[];
}

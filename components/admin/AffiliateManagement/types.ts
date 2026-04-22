import type {
  AffiliateAdminCommissionStage,
  AffiliateAdminSettlementSafetyStatus,
  AffiliateAdminSettlementStatus,
  AffiliatePrimaryStatus,
  AffiliateStatusTag,
} from '@/components/dashboard/affiliate/types';

export type TabKey = 'applications' | 'orders' | 'withdrawals' | 'affiliates';

export type CommissionStageFilter = 'all' | AffiliateAdminCommissionStage;
export type PartnerPrimaryStatusFilter = 'all' | AffiliatePrimaryStatus;
export type PartnerStatusTagFilter = 'all' | AffiliateStatusTag;

export type SettlementQueueFilter =
  | 'all'
  | 'submitted_pending'
  | 'submitted_manual_review'
  | 'submitted_blocked'
  | 'approved'
  | 'processing'
  | 'paid'
  | 'rejected';

export interface SettlementQueuePreset {
  label: string;
  status?: AffiliateAdminSettlementStatus;
  safety_status?: AffiliateAdminSettlementSafetyStatus;
}

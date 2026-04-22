'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  Link2,
  ListOrdered,
  Loader2,
  Megaphone,
  Plus,
  Search,
  ShieldCheck,
  TrendingUp,
  Trash2,
  Upload,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';

import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { defaultAffiliateApplicationDraft } from '@/components/dashboard/affiliate/mockData';
import type {
  AffiliateApplicationChannelType,
  AffiliateApplicationDraft,
  AffiliateApplicationPayload,
  AffiliateDashboardData,
  AffiliateInviteItem,
  AffiliateInviteStatus,
  AffiliateOrderItem,
  AffiliateProfile,
  AffiliateProgramStatus,
  AffiliateSettlementItem,
  AffiliateSettlementMethod,
  AffiliateSettlementSummary,
  AffiliateSettlementStatus,
  AffiliateUserOrderStatus,
} from '@/components/dashboard/affiliate/types';
import { affiliateService } from '@/services/affiliateService';
import { uploadToR2 } from '@/utils/r2';

type TabKey = 'dashboard' | 'invites' | 'orders' | 'withdrawals' | 'faq';
type StatusTimelineKey = 'submittedAt' | 'reviewedAt' | 'approvedAt';
type DashboardMetricKey = 'totalEarnings' | 'pending' | 'available' | 'paid';
type OrderFilterValue = 'all' | AffiliateUserOrderStatus;
type SettlementFilterValue = 'all' | AffiliateSettlementStatus;

interface AffiliateUserContentProps {
  initialProfile: AffiliateProfile | null;
  initialProfileLoadFailed?: boolean;
  initialProfileErrorMessage?: string | null;
}

const MAX_PROOF_FILE_SIZE = 5 * 1024 * 1024;
const MAX_PROMOTION_PLAN_LENGTH = 500;
const MAX_ADDITIONAL_NOTES_LENGTH = 1000;
const ALLOWED_PROOF_TYPES = ['image/png', 'image/jpeg'];
const PAGE_SIZE_OPTIONS = [20, 50, 100];
const FALLBACK_SETTLEMENT_METHODS: AffiliateSettlementMethod[] = ['stripe', 'wechat'];
const DEMO_DASHBOARD_DATA: AffiliateDashboardData = {
  can_apply: true,
  application_status: null,
  affiliate_status: null,
  review_note: null,
  link_status: 'locked',
  invite_code: null,
  share_url: null,
  share_copy_text: null,
  cards: {
    total_earned: '2450.00',
    pending_settlement: '420.00',
    withdrawable_amount: '780.00',
    paid_amount: '1250.00',
  },
};

const metricIcons: Record<DashboardMetricKey, React.ComponentType<{ className?: string }>> = {
  totalEarnings: TrendingUp,
  pending: Clock3,
  available: BadgeCheck,
  paid: Wallet,
};

const tabIcons = {
  dashboard: LayoutDashboard,
  invites: Users,
  orders: ListOrdered,
  withdrawals: CreditCard,
  faq: HelpCircle,
} as const;

const applicationChannelOptions: AffiliateApplicationChannelType[] = [
  'youtube',
  'x',
  'tiktok',
  'instagram',
  'blog',
  'discord',
  'newsletter',
  'other',
];

const orderStatusOptions: OrderFilterValue[] = [
  'all',
  'pending_hold',
  'available',
  'locked',
  'paid',
  'reversed',
];

const settlementStatusOptions: SettlementFilterValue[] = [
  'all',
  'submitted',
  'processing',
  'paid',
  'rejected',
  'cancelled',
];

function getInviteStatusClasses(status: AffiliateInviteStatus) {
  switch (status) {
    case 'converted':
      return 'border-green-500/20 bg-green-500/10 text-green-500';
    case 'high_value':
      return 'border-primary/20 bg-primary/10 text-primary';
    default:
      return 'border-border bg-muted/40 text-muted-foreground';
  }
}

function getOrderStatusClasses(status: AffiliateUserOrderStatus) {
  switch (status) {
    case 'available':
      return 'border-green-500/20 bg-green-500/10 text-green-500';
    case 'locked':
      return 'border-primary/20 bg-primary/10 text-primary';
    case 'paid':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500';
    case 'reversed':
      return 'border-destructive/20 bg-destructive/10 text-destructive';
    default:
      return 'border-amber-500/20 bg-amber-500/10 text-amber-500';
  }
}

function getSettlementStatusClasses(status: AffiliateSettlementStatus) {
  switch (status) {
    case 'paid':
      return 'border-green-500/20 bg-green-500/10 text-green-500';
    case 'processing':
      return 'border-primary/20 bg-primary/10 text-primary';
    case 'rejected':
      return 'border-destructive/20 bg-destructive/10 text-destructive';
    case 'cancelled':
      return 'border-border bg-muted/40 text-muted-foreground';
    default:
      return 'border-amber-500/20 bg-amber-500/10 text-amber-500';
  }
}

function mapProfileToProgramStatus(profile: AffiliateProfile | null): AffiliateProgramStatus {
  switch (profile?.application_status) {
    case 'submitted':
      return 'pending';
    case 'approved':
      if (profile.affiliate_status === 'suspended') {
        return 'suspended';
      }

      if (profile.affiliate_status === 'banned') {
        return 'banned';
      }

      return 'approved';
    case 'rejected':
      return 'rejected';
    default:
      return 'not_applied';
  }
}

function createSubmittedFallbackProfile(): AffiliateProfile {
  return {
    can_apply: false,
    application_status: 'submitted',
    affiliate_status: null,
    review_note: null,
    submitted_at: new Date().toISOString(),
    reviewed_at: null,
    approved_at: null,
    current_application: null,
  };
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMoney(value: string | null | undefined) {
  if (!value) {
    return '--';
  }

  return value.startsWith('$') ? value : `$${value}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getTotalPages(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize));
}

function shouldRefreshProfileAfterSubmitConflict(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('under review') ||
    message.includes('already approved') ||
    message.includes('already reviewed') ||
    message.includes('already submitted')
  );
}

function getSettlementRecordAmount(item: AffiliateSettlementItem) {
  return item.paid_amount || item.approved_amount || item.requested_amount;
}

function isNotFoundLikeError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const status = (error as Error & { status?: number }).status;
  const message = error.message.toLowerCase();

  return status === 404 || message.includes('not found');
}

function createZeroDashboardData(profile: AffiliateProfile | null): AffiliateDashboardData {
  return {
    can_apply: profile?.can_apply ?? false,
    application_status: profile?.application_status ?? null,
    affiliate_status: profile?.affiliate_status ?? null,
    review_note: profile?.review_note ?? null,
    link_status: 'locked',
    invite_code: null,
    share_url: null,
    share_copy_text: null,
    cards: {
      total_earned: '0.00',
      pending_settlement: '0.00',
      withdrawable_amount: '0.00',
      paid_amount: '0.00',
    },
  };
}

function createFallbackSettlementSummary(disabledReason: string): AffiliateSettlementSummary {
  return {
    withdrawable_amount: '0.00',
    min_withdraw_amount: '100.00',
    settlement_cycle: 'monthly',
    supported_methods: FALLBACK_SETTLEMENT_METHODS,
    default_method: 'stripe',
    button_enabled: false,
    button_disabled_reason: disabledReason,
  };
}

export default function AffiliateUserContent({
  initialProfile,
  initialProfileLoadFailed = false,
  initialProfileErrorMessage = null,
}: AffiliateUserContentProps) {
  const t = useTranslations('Dashboard.Affiliate');
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [profile, setProfile] = useState<AffiliateProfile | null>(initialProfile);
  const [profileLoadFailed, setProfileLoadFailed] = useState(initialProfileLoadFailed);
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(initialProfileErrorMessage);

  const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);
  const [applicationDraft, setApplicationDraft] = useState<AffiliateApplicationDraft>(defaultAffiliateApplicationDraft);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const proofInputRef = useRef<HTMLInputElement | null>(null);

  const [dashboardData, setDashboardData] = useState<AffiliateDashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardLoaded, setDashboardLoaded] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [inviteSearchInput, setInviteSearchInput] = useState('');
  const [inviteKeyword, setInviteKeyword] = useState('');
  const [invitePage, setInvitePage] = useState(1);
  const [invitePageSize, setInvitePageSize] = useState(20);
  const [inviteTotal, setInviteTotal] = useState(0);
  const [inviteItems, setInviteItems] = useState<AffiliateInviteItem[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderFilterValue>('all');
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(20);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderItems, setOrderItems] = useState<AffiliateOrderItem[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [settlementStatusFilter, setSettlementStatusFilter] = useState<SettlementFilterValue>('all');
  const [settlementPage, setSettlementPage] = useState(1);
  const [settlementPageSize, setSettlementPageSize] = useState(20);
  const [settlementTotal, setSettlementTotal] = useState(0);
  const [settlementItems, setSettlementItems] = useState<AffiliateSettlementItem[]>([]);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [settlementSummary, setSettlementSummary] = useState<AffiliateSettlementSummary | null>(null);

  const [isSettlementDialogOpen, setIsSettlementDialogOpen] = useState(false);
  const [settlementMethod, setSettlementMethod] = useState<AffiliateSettlementMethod>('stripe');
  const [settlementDestinationAccount, setSettlementDestinationAccount] = useState('');
  const [isSubmittingSettlement, setIsSubmittingSettlement] = useState(false);

  const dashboardRequestRef = useRef(0);
  const invitesRequestRef = useRef(0);
  const ordersRequestRef = useRef(0);
  const settlementsRequestRef = useRef(0);
  const dashboardProfileKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    setProfileLoadFailed(initialProfileLoadFailed);
  }, [initialProfileLoadFailed]);

  useEffect(() => {
    setProfileErrorMessage(initialProfileErrorMessage);
  }, [initialProfileErrorMessage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setInviteKeyword(inviteSearchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [inviteSearchInput]);

  useEffect(() => {
    setInvitePage(1);
  }, [inviteKeyword]);

  useEffect(() => {
    return () => {
      if (proofPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(proofPreviewUrl);
      }
    };
  }, [proofPreviewUrl]);

  const programStatus = mapProfileToProgramStatus(profile);
  const hasProfile = profile !== null;
  const canApply = profile?.can_apply;
  const hasApprovedApplication = profile?.application_status === 'approved';
  const isApproved = programStatus === 'approved';
  const isPending = programStatus === 'pending';
  const isRejected = programStatus === 'rejected';
  const isSuspended = programStatus === 'suspended';
  const isBanned = programStatus === 'banned';
  const hasProfileLoadError = profileLoadFailed && !profile;
  const currentApplicationId = profile?.current_application?.id ?? null;

  const canOpenApplicationForm =
    !hasProfileLoadError &&
    (programStatus === 'rejected'
      ? canApply === true
      : programStatus === 'not_applied'
        ? hasProfile
          ? canApply !== false
          : true
        : false);

  const showHeroButton = isApproved || isPending || canOpenApplicationForm;
  const heroButtonLabel = isApproved
    ? t('hero.actions.approved')
    : isPending
      ? t('hero.actions.reviewing')
      : isRejected
        ? t('hero.actions.resubmit')
        : t('hero.actions.apply');

  const statusTimeline: Array<{ key: StatusTimelineKey; value: string }> = [
    profile?.submitted_at ? { key: 'submittedAt', value: profile.submitted_at } : null,
    profile?.reviewed_at ? { key: 'reviewedAt', value: profile.reviewed_at } : null,
    profile?.approved_at ? { key: 'approvedAt', value: profile.approved_at } : null,
  ].filter((item): item is { key: StatusTimelineKey; value: string } => item !== null);

  const rejectionNote = profile?.review_note?.trim() || t('status.rejected.reasonValue');
  const isUsingDemoDashboard = programStatus === 'not_applied' || isPending;
  const requiresLiveDashboard = hasApprovedApplication && !isUsingDemoDashboard;
  const isDashboardReady = !requiresLiveDashboard || dashboardLoaded;
  const showDashboardPendingState = requiresLiveDashboard && !dashboardLoaded;
  const dashboardReadyState = isDashboardReady ? 'ready' : 'loading';
  const dashboardProfileKey = `${currentApplicationId ?? 'none'}:${profile?.application_status ?? 'none'}:${profile?.affiliate_status ?? 'none'}`;
  const showDemoDashboardNotice = programStatus === 'not_applied';
  const effectiveDashboardData = isUsingDemoDashboard ? DEMO_DASHBOARD_DATA : dashboardData;

  const dashboardMetrics = effectiveDashboardData
    ? [
        { key: 'totalEarnings' as const, value: formatMoney(effectiveDashboardData.cards.total_earned) },
        { key: 'pending' as const, value: formatMoney(effectiveDashboardData.cards.pending_settlement) },
        { key: 'available' as const, value: formatMoney(effectiveDashboardData.cards.withdrawable_amount) },
        { key: 'paid' as const, value: formatMoney(effectiveDashboardData.cards.paid_amount) },
      ]
    : [];

  const linkUnlocked =
    isApproved && effectiveDashboardData?.link_status === 'active' && Boolean(effectiveDashboardData.share_url);
  const shareUrl = linkUnlocked ? effectiveDashboardData?.share_url || '' : '';
  const inviteCode = linkUnlocked ? effectiveDashboardData?.invite_code?.trim() || '' : '';
  const shareCopyText = linkUnlocked ? t('link.shareCopyText', { shareUrl }) : '';
  const lockedLinkBadgeLabel = isSuspended
    ? t('link.lockedBadgeSuspended')
    : isBanned
      ? t('link.lockedBadgeBanned')
      : t('link.lockedBadge');
  const lockedLinkToast = isSuspended
    ? t('link.lockedToastSuspended')
    : isBanned
      ? t('link.lockedToastBanned')
      : t('link.lockedToast');
  const referralLinkDescription = linkUnlocked
    ? t('link.descriptionApproved')
    : showDashboardPendingState
      ? t('dashboard.loading')
    : isSuspended
      ? t('link.descriptionSuspended')
      : isBanned
        ? t('link.descriptionBanned')
    : isPending
      ? t('link.descriptionPending')
      : t('link.descriptionNotApplied');
  const referralCodeValue = linkUnlocked
    ? inviteCode || '--'
    : showDashboardPendingState
      ? t('dashboard.loading')
    : isSuspended
      ? t('link.suspendedValue')
      : isBanned
        ? t('link.bannedValue')
    : isPending
      ? t('link.pendingValue')
      : t('link.codeLockedValue');

  const inviteTotalPages = getTotalPages(inviteTotal, invitePageSize);
  const orderTotalPages = getTotalPages(orderTotal, orderPageSize);
  const settlementTotalPages = getTotalPages(settlementTotal, settlementPageSize);

  const displaySettlementSummary =
    settlementSummary ?? (!hasApprovedApplication ? createFallbackSettlementSummary(t('withdrawals.requestDisabled')) : null);
  const supportedSettlementMethods =
    displaySettlementSummary?.supported_methods.length
      ? displaySettlementSummary.supported_methods
      : FALLBACK_SETTLEMENT_METHODS;
  const supportedMethodsLabel =
    displaySettlementSummary?.supported_methods.length || !displaySettlementSummary
      ? supportedSettlementMethods.map((method) => t(`withdrawals.methodValues.${method}`)).join(' / ')
      : t('withdrawals.supportedMethodsValue');
  const settlementDisabledReason =
    displaySettlementSummary?.button_disabled_reason?.trim() || t('withdrawals.requestDisabled');

  const refreshDashboard = async () => {
    const requestId = ++dashboardRequestRef.current;
    setDashboardLoading(true);
    setDashboardError(null);

    try {
      const data = await affiliateService.getDashboard();
      if (dashboardRequestRef.current !== requestId) {
        return;
      }

      setDashboardData(data);
      setDashboardLoaded(true);
    } catch (error) {
      if (dashboardRequestRef.current !== requestId) {
        return;
      }

      if (!hasApprovedApplication && !isUsingDemoDashboard && isNotFoundLikeError(error)) {
        setDashboardData(createZeroDashboardData(profile));
        setDashboardLoaded(true);
        return;
      }

      setDashboardError(getErrorMessage(error, t('dashboard.loadError')));
      setDashboardLoaded(true);
    } finally {
      if (dashboardRequestRef.current === requestId) {
        setDashboardLoading(false);
      }
    }
  };

  const refreshInvites = async () => {
    const requestId = ++invitesRequestRef.current;
    setInviteLoading(true);
    setInviteError(null);

    try {
      const data = await affiliateService.listInvites({
        page: invitePage,
        page_size: invitePageSize,
        keyword: inviteKeyword || undefined,
      });

      if (invitesRequestRef.current !== requestId) {
        return;
      }

      setInviteItems(data.items);
      setInviteTotal(data.total);
      setInvitePage(data.page);
      setInvitePageSize(data.page_size);
    } catch (error) {
      if (invitesRequestRef.current !== requestId) {
        return;
      }

      if (isNotFoundLikeError(error)) {
        setInviteItems([]);
        setInviteTotal(0);
        return;
      }

      setInviteError(getErrorMessage(error, t('invites.loadError')));
    } finally {
      if (invitesRequestRef.current === requestId) {
        setInviteLoading(false);
      }
    }
  };

  const refreshOrders = async () => {
    const requestId = ++ordersRequestRef.current;
    setOrderLoading(true);
    setOrderError(null);

    try {
      const data = await affiliateService.listOrders({
        page: orderPage,
        page_size: orderPageSize,
        status: orderStatusFilter === 'all' ? undefined : orderStatusFilter,
      });

      if (ordersRequestRef.current !== requestId) {
        return;
      }

      setOrderItems(data.items);
      setOrderTotal(data.total);
      setOrderPage(data.page);
      setOrderPageSize(data.page_size);
    } catch (error) {
      if (ordersRequestRef.current !== requestId) {
        return;
      }

      if (isNotFoundLikeError(error)) {
        setOrderItems([]);
        setOrderTotal(0);
        return;
      }

      setOrderError(getErrorMessage(error, t('orders.loadError')));
    } finally {
      if (ordersRequestRef.current === requestId) {
        setOrderLoading(false);
      }
    }
  };

  const refreshSettlements = async () => {
    const requestId = ++settlementsRequestRef.current;
    setSettlementLoading(true);
    setSettlementError(null);

    try {
      const data = await affiliateService.listSettlements({
        page: settlementPage,
        page_size: settlementPageSize,
        status: settlementStatusFilter === 'all' ? undefined : settlementStatusFilter,
      });

      if (settlementsRequestRef.current !== requestId) {
        return;
      }

      setSettlementItems(data.items);
      setSettlementTotal(data.total);
      setSettlementPage(data.page);
      setSettlementPageSize(data.page_size);
      setSettlementSummary(data.summary);
    } catch (error) {
      if (settlementsRequestRef.current !== requestId) {
        return;
      }

      if (isNotFoundLikeError(error)) {
        setSettlementItems([]);
        setSettlementTotal(0);
        setSettlementSummary(createFallbackSettlementSummary(t('withdrawals.requestDisabled')));
        return;
      }

      setSettlementError(getErrorMessage(error, t('withdrawals.loadError')));
    } finally {
      if (settlementsRequestRef.current === requestId) {
        setSettlementLoading(false);
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard' && !dashboardLoaded && !isUsingDemoDashboard) {
      void refreshDashboard();
    }
  }, [activeTab, dashboardLoaded, isUsingDemoDashboard]);

  useEffect(() => {
    if (activeTab !== 'invites') {
      return;
    }

    if (!hasApprovedApplication) {
      setInviteLoading(false);
      setInviteError(null);
      setInviteItems([]);
      setInviteTotal(0);
      return;
    }

    void refreshInvites();
  }, [activeTab, invitePage, invitePageSize, inviteKeyword, hasApprovedApplication]);

  useEffect(() => {
    if (activeTab !== 'orders') {
      return;
    }

    if (!hasApprovedApplication) {
      setOrderLoading(false);
      setOrderError(null);
      setOrderItems([]);
      setOrderTotal(0);
      return;
    }

    void refreshOrders();
  }, [activeTab, orderPage, orderPageSize, orderStatusFilter, hasApprovedApplication]);

  useEffect(() => {
    if (activeTab !== 'withdrawals') {
      return;
    }

    if (!hasApprovedApplication) {
      setSettlementLoading(false);
      setSettlementError(null);
      setSettlementItems([]);
      setSettlementTotal(0);
      setSettlementSummary(null);
      return;
    }

    void refreshSettlements();
  }, [activeTab, settlementPage, settlementPageSize, settlementStatusFilter, hasApprovedApplication]);

  const handleDraftChange = <K extends keyof AffiliateApplicationDraft>(
    key: K,
    value: AffiliateApplicationDraft[K]
  ) => {
    setApplicationDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const clearProofPreview = () => {
    if (proofPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(proofPreviewUrl);
    }

    setProofPreviewUrl(null);
  };

  const resetApplicationForm = () => {
    clearProofPreview();
    if (proofInputRef.current) {
      proofInputRef.current.value = '';
    }
    setApplicationDraft(defaultAffiliateApplicationDraft);
    setIsUploadingProof(false);
    setIsSubmittingApplication(false);
  };

  const openApplicationForm = () => {
    resetApplicationForm();
    setActiveTab('dashboard');
    setIsApplicationFormOpen(true);
  };

  const handlePrimaryAction = () => {
    if (canOpenApplicationForm) {
      openApplicationForm();
    }
  };

  const handleCopyCode = async () => {
    if (!linkUnlocked || !inviteCode) {
      toast.error(lockedLinkToast);
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteCode);
      toast.success(t('link.copyCodeSuccess'));
    } catch {
      toast.error(t('link.copyError'));
    }
  };

  const handleCopyShareText = async () => {
    if (!linkUnlocked || !shareCopyText) {
      toast.error(lockedLinkToast);
      return;
    }

    try {
      await navigator.clipboard.writeText(shareCopyText);
      toast.success(t('link.copyShareSuccess'));
    } catch {
      toast.error(t('link.copyError'));
    }
  };

  const handleChannelToggle = (channel: AffiliateApplicationChannelType, checked: boolean) => {
    setApplicationDraft((current) => ({
      ...current,
      channelTypes: checked
        ? [...current.channelTypes, channel]
        : current.channelTypes.filter((item) => item !== channel),
    }));
  };

  const handleAccountLinkChange = (index: number, value: string) => {
    setApplicationDraft((current) => ({
      ...current,
      accountLinks: current.accountLinks.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  };

  const handleAddAccountLink = () => {
    setApplicationDraft((current) => ({
      ...current,
      accountLinks: [...current.accountLinks, ''],
    }));
  };

  const handleRemoveAccountLink = (index: number) => {
    setApplicationDraft((current) => ({
      ...current,
      accountLinks:
        current.accountLinks.length === 1
          ? ['']
          : current.accountLinks.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleRemoveProof = () => {
    clearProofPreview();
    handleDraftChange('proofImageUrl', '');
    handleDraftChange('proofImageName', '');
    handleDraftChange('proofImageSize', 0);

    if (proofInputRef.current) {
      proofInputRef.current.value = '';
    }
  };

  const handleProofUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
      toast.error(t('application.form.validationProofType'));
      event.target.value = '';
      return;
    }

    if (file.size > MAX_PROOF_FILE_SIZE) {
      toast.error(t('application.form.validationProofSize'));
      event.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    clearProofPreview();
    setProofPreviewUrl(previewUrl);
    setIsUploadingProof(true);

    try {
      const fileName = `affiliate-proof-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
      const result = await uploadToR2(file, fileName);

      setApplicationDraft((current) => ({
        ...current,
        proofImageUrl: result.url,
        proofImageName: file.name,
        proofImageSize: file.size,
      }));
      toast.success(t('application.form.uploadSuccess'));
    } catch (error) {
      console.error('Failed to upload proof image:', error);
      clearProofPreview();
      setApplicationDraft((current) => ({
        ...current,
        proofImageUrl: '',
        proofImageName: '',
        proofImageSize: 0,
      }));
      toast.error(t('application.form.uploadFailed'));
    } finally {
      setIsUploadingProof(false);
      event.target.value = '';
    }
  };

  const refreshProfileAfterSubmit = async () => {
    try {
      const refreshedProfile = await affiliateService.getProfile();
      setProfile(refreshedProfile || createSubmittedFallbackProfile());
      setProfileLoadFailed(false);
      setProfileErrorMessage(null);
    } catch (error) {
      console.error('Failed to refresh affiliate profile after submit:', error);
      setProfile(createSubmittedFallbackProfile());
      setProfileLoadFailed(false);
      setProfileErrorMessage(null);
    }
  };

  const resetDashboardState = useCallback(() => {
    setDashboardData(null);
    setDashboardError(null);
    setDashboardLoaded(false);
  }, []);

  useEffect(() => {
    const previousKey = dashboardProfileKeyRef.current;
    dashboardProfileKeyRef.current = dashboardProfileKey;

    if (previousKey === null || previousKey === dashboardProfileKey) {
      return;
    }

    resetDashboardState();
  }, [dashboardProfileKey, resetDashboardState]);

  const handleApplicationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isUploadingProof) {
      toast.error(t('application.form.validationUploadInProgress'));
      return;
    }

    if (applicationDraft.channelTypes.length === 0) {
      toast.error(t('application.form.validationChannels'));
      return;
    }

    const sanitizedLinks = applicationDraft.accountLinks.map((item) => item.trim()).filter(Boolean);

    if (sanitizedLinks.length === 0) {
      toast.error(t('application.form.validationAccountLinks'));
      return;
    }

    if (sanitizedLinks.some((item) => !isValidHttpUrl(item))) {
      toast.error(t('application.form.validationAccountLinkInvalid'));
      return;
    }

    if (!applicationDraft.proofImageUrl.trim()) {
      toast.error(t('application.form.validationProof'));
      return;
    }

    if (!applicationDraft.promotionPlan.trim()) {
      toast.error(t('application.form.validationPromotionPlan'));
      return;
    }

    if (!applicationDraft.contactInfo.trim()) {
      toast.error(t('application.form.validationContact'));
      return;
    }

    const payload: AffiliateApplicationPayload = {
      channel_types: applicationDraft.channelTypes,
      account_links: sanitizedLinks,
      proof_image_url: applicationDraft.proofImageUrl,
      proof_image_name: applicationDraft.proofImageName,
      proof_image_size: applicationDraft.proofImageSize,
      promotion_plan: applicationDraft.promotionPlan.trim(),
      contact_info: applicationDraft.contactInfo.trim(),
      additional_notes: applicationDraft.additionalNotes.trim(),
    };

    try {
      setIsSubmittingApplication(true);
      const result = await affiliateService.submitApplication(payload);
      setIsApplicationFormOpen(false);
      resetApplicationForm();
      toast.success(result.message || t('application.form.submitSuccess'));
      await refreshProfileAfterSubmit();
      resetDashboardState();
    } catch (error) {
      console.error('Failed to submit affiliate application:', error);

      if (shouldRefreshProfileAfterSubmitConflict(error)) {
        await refreshProfileAfterSubmit();
        resetDashboardState();
      }

      toast.error(getErrorMessage(error, t('application.form.submitError')));
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const openSettlementDialog = () => {
    if (!displaySettlementSummary?.button_enabled) {
      toast.error(settlementDisabledReason);
      return;
    }

    const defaultMethod =
      displaySettlementSummary && supportedSettlementMethods.includes(displaySettlementSummary.default_method)
        ? displaySettlementSummary.default_method
        : supportedSettlementMethods[0];

    setSettlementMethod(defaultMethod);
    setSettlementDestinationAccount('');
    setIsSettlementDialogOpen(true);
  };

  const handleSettlementSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const destinationAccount = settlementDestinationAccount.trim();

    if (!destinationAccount) {
      toast.error(t('withdrawals.requestDialog.validationAccount'));
      return;
    }

    try {
      setIsSubmittingSettlement(true);
      await affiliateService.requestSettlement({
        method: settlementMethod,
        destination_account: destinationAccount,
      });

      setIsSettlementDialogOpen(false);
      setSettlementDestinationAccount('');
      toast.success(t('withdrawals.requestDialog.submitSuccess'));

      await Promise.all([
        refreshDashboard(),
        refreshSettlements(),
        activeTab === 'orders' ? refreshOrders() : Promise.resolve(),
      ]);
    } catch (error) {
      toast.error(getErrorMessage(error, t('withdrawals.requestDialog.submitError')));
    } finally {
      setIsSubmittingSettlement(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <h1 className="gradient-text text-3xl font-bold tracking-tight sm:text-4xl">{t('title')}</h1>
        <p className="text-sm text-muted-foreground sm:text-base">{t('description')}</p>
      </div>

      {hasProfileLoadError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-semibold">{t('profile.loadErrorTitle')}</p>
          <p className="mt-1 text-destructive/80">{profileErrorMessage || t('profile.loadErrorDescription')}</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-700 dark:text-amber-300">{t('banner.title')}</p>
            <p className="text-amber-800/90 dark:text-amber-100/90">{t('banner.description')}</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)} className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-5 rounded-none border-b border-border/60 bg-transparent p-0 text-muted-foreground">
          {(Object.keys(tabIcons) as TabKey[]).map((tab) => {
            const Icon = tabIcons[tab];

            return (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Icon className="mr-2 h-4 w-4" />
                {t(`tabs.${tab}`)}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent
          value="dashboard"
          className="mt-0 space-y-6"
          data-testid="affiliate-dashboard-panel"
          data-ready-state={dashboardReadyState}
        >
          <Card className="overflow-hidden border border-primary/20 bg-gradient-to-r from-primary via-primary/95 to-[hsl(var(--gradient-end))] text-primary-foreground shadow-[0_20px_60px_rgba(37,99,235,0.2)]">
            <CardContent className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
                  <Megaphone className="h-3.5 w-3.5" />
                  {t('hero.badge')}
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('hero.title')}</h2>
                  <p className="max-w-3xl text-sm leading-7 text-primary-foreground/85 sm:text-base">
                    {t('hero.description')}
                  </p>
                </div>
              </div>

              {showHeroButton ? (
                <Button
                  size="lg"
                  variant={isPending ? 'outline' : 'secondary'}
                  className={cn(
                    'h-12 min-w-[180px] rounded-xl px-6 font-semibold transition-all duration-200',
                    isPending
                      ? 'border-white/15 bg-slate-950/20 text-white shadow-[0_16px_40px_rgba(15,23,42,0.24)] backdrop-blur-md disabled:opacity-100'
                      : 'text-primary'
                  )}
                  disabled={isPending || isApproved || isSubmittingApplication || isUploadingProof}
                  onClick={handlePrimaryAction}
                >
                  {isPending ? <Clock3 className="h-4 w-4 text-white/90" /> : null}
                  {heroButtonLabel}
                  {canOpenApplicationForm ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {showDemoDashboardNotice ? (
            <Card className="border border-amber-500/30 bg-amber-500/10">
              <CardContent className="flex gap-3 p-5">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">{t('dashboard.demoTitle')}</p>
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200"
                    >
                      {t('metrics.demoBadge')}
                    </Badge>
                  </div>
                  <p className="text-sm leading-6 text-amber-800/90 dark:text-amber-50/90">
                    {t('dashboard.demoDescription')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : dashboardError && !effectiveDashboardData ? (
            <Card className="border border-destructive/30 bg-destructive/5">
              <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-destructive">{t('dashboard.loadErrorTitle')}</p>
                  <p className="text-sm text-destructive/80">{dashboardError}</p>
                </div>
                <Button variant="outline" onClick={() => void refreshDashboard()}>
                  {t('dashboard.retry')}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {effectiveDashboardData ? (
              dashboardMetrics.map((metric) => {
                const Icon = metricIcons[metric.key];

                return (
                  <Card key={metric.key} className="border border-border/60 bg-card/70 backdrop-blur-sm">
                    <CardContent className="space-y-5 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            {t(`metrics.items.${metric.key}.label`)}
                          </p>
                          <p className="text-3xl font-bold tracking-tight">{metric.value}</p>
                        </div>
                        <div className="rounded-xl bg-primary/10 p-3 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{t(`metrics.items.${metric.key}.hint`)}</p>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={`metric-skeleton-${index}`} className="border border-border/60 bg-card/70 backdrop-blur-sm">
                  <CardContent className="flex min-h-[152px] items-center justify-center p-6 text-sm text-muted-foreground">
                    {dashboardLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('dashboard.loading')}
                      </div>
                    ) : (
                      t('dashboard.empty')
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Card
            className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-emerald-500/5 shadow-[0_24px_80px_rgba(15,23,42,0.16)]"
            data-testid="affiliate-link-card"
            data-link-state={showDashboardPendingState ? 'loading' : linkUnlocked ? 'active' : programStatus}
          >
            <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
            <CardHeader className="relative gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-500 text-primary-foreground shadow-[0_14px_32px_rgba(37,99,235,0.24)]">
                  <Link2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 space-y-2">
                  <CardTitle className="text-xl">{t('link.title')}</CardTitle>
                  <CardDescription className="max-w-3xl">{referralLinkDescription}</CardDescription>
                </div>
              </div>
              <div className="flex shrink-0">
                {linkUnlocked ? (
                  <Badge className="gap-1.5 border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-emerald-500 hover:bg-emerald-500/15">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="sr-only">{t('link.descriptionApproved')}</span>
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className={cn(
                      isSuspended
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                        : isBanned
                          ? 'border-destructive/30 bg-destructive/10 text-destructive'
                          : 'border-primary/20 bg-primary/10 text-primary'
                    )}
                  >
                    {lockedLinkBadgeLabel}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative space-y-5">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">{t('link.shareCopyTitle')}</Label>
                <div
                  className={cn(
                    'rounded-2xl border border-white/10 bg-background/75 p-5 text-sm leading-7 shadow-inner shadow-black/5 backdrop-blur-sm',
                    'whitespace-normal break-words overflow-x-hidden',
                    linkUnlocked ? 'text-foreground' : 'italic text-muted-foreground'
                  )}
                >
                  {linkUnlocked ? shareCopyText : t('link.shareCopyLockedValue')}
                </div>
                <div className="flex justify-end pt-1">
                  <Button
                    className="h-10 min-w-[150px] gap-2 rounded-xl shadow-[0_12px_28px_rgba(37,99,235,0.2)]"
                    disabled={!linkUnlocked}
                    onClick={handleCopyShareText}
                  >
                    <Copy className="h-4 w-4" />
                    {t('link.copyShare')}
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/50 p-4 backdrop-blur-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                    <Label className="shrink-0 text-sm font-semibold">{t('link.codeLabel')}</Label>
                    <div
                      data-testid="affiliate-invite-code-value"
                      className={cn(
                        'w-fit max-w-full rounded-xl border border-primary/15 bg-primary/10 px-4 py-2 font-mono text-sm font-semibold tracking-wide text-primary',
                        !linkUnlocked && 'border-border/60 bg-muted/60 font-sans italic tracking-normal text-muted-foreground'
                      )}
                    >
                      {referralCodeValue}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 w-fit gap-2 rounded-xl bg-background/70"
                    data-testid="affiliate-copy-code-button"
                    disabled={!linkUnlocked || !inviteCode}
                    onClick={handleCopyCode}
                  >
                    <Copy className="h-4 w-4" />
                    {t('link.copyCode')}
                  </Button>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">{t('link.helper')}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border border-border/60 bg-card/70">
              <CardHeader>
                <CardTitle className="text-xl">{t('rules.title')}</CardTitle>
                <CardDescription>{t('rules.description')}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {[
                  { key: 'commission', icon: TrendingUp },
                  { key: 'safetyPeriod', icon: Clock3 },
                  { key: 'minimumPayout', icon: CreditCard },
                  { key: 'fraudPolicy', icon: ShieldCheck },
                ].map((rule) => {
                  const Icon = rule.icon;

                  return (
                    <div key={rule.key} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="font-semibold">{t(`rules.items.${rule.key}.title`)}</p>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {t(`rules.items.${rule.key}.description`)}
                      </p>
                    </div>
                  );
                })}
                <p className="md:col-span-2 text-xs leading-5 text-muted-foreground">
                  {t('rules.disclaimer')}
                </p>
              </CardContent>
            </Card>

            <Card
              className={cn(
                'border bg-card/70',
                isApproved
                  ? 'border-green-500/20'
                  : isBanned
                    ? 'border-destructive/30'
                    : isSuspended
                      ? 'border-amber-500/30'
                  : isRejected
                    ? 'border-destructive/30'
                    : isPending
                      ? 'border-primary/20'
                      : 'border-border/60'
              )}
              data-testid="affiliate-program-status"
              data-program-status={programStatus}
              data-ready-state={dashboardReadyState}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'rounded-xl p-2',
                      isApproved
                        ? 'bg-green-500/10 text-green-500'
                        : isBanned
                          ? 'bg-destructive/10 text-destructive'
                          : isSuspended
                            ? 'bg-amber-500/10 text-amber-500'
                        : isRejected
                          ? 'bg-destructive/10 text-destructive'
                          : isPending
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isApproved ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : isBanned ? (
                      <XCircle className="h-5 w-5" />
                    ) : isSuspended ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : isRejected ? (
                      <XCircle className="h-5 w-5" />
                    ) : isPending ? (
                      <Clock3 className="h-5 w-5" />
                    ) : (
                      <Megaphone className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-xl" data-testid="affiliate-program-status-title">
                      {t(`status.${programStatus}.title`)}
                    </CardTitle>
                    <CardDescription>{t(`status.${programStatus}.description`)}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">{t(`status.${programStatus}.details`)}</p>

                {statusTimeline.length > 0 ? (
                  <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
                    <div className="space-y-2">
                      {statusTimeline.map((item) => (
                        <div key={item.key} className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-muted-foreground">{t(`status.timeline.${item.key}`)}</span>
                          <span className="text-right font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {programStatus === 'rejected' ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <span className="font-semibold">{t('status.rejected.reasonLabel')}</span> {rejectionNote}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  {canOpenApplicationForm ? (
                    <Button onClick={openApplicationForm} className="rounded-xl">
                      {programStatus === 'rejected' ? t('application.form.resubmit') : t('application.form.open')}
                    </Button>
                  ) : null}

                  {programStatus === 'approved' ? (
                    <Button variant="outline" className="rounded-xl" onClick={handleCopyShareText}>
                      {t('link.copyShare')}
                    </Button>
                  ) : null}

                  <Button
                    asChild
                    variant="outline"
                    className="rounded-xl border-primary/25 bg-primary/10 text-primary shadow-[0_8px_24px_rgba(37,99,235,0.12)] hover:bg-primary/15 hover:text-primary"
                  >
                    <Link href="/support">
                      <HelpCircle className="h-4 w-4" />
                      {t('faq.supportAction')}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invites" className="mt-0">
          <Card className="border border-border/60 bg-card/70">
            <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-xl">{t('invites.title')}</CardTitle>
                <CardDescription>{t('invites.description')}</CardDescription>
              </div>

              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={inviteSearchInput}
                  onChange={(event) => setInviteSearchInput(event.target.value)}
                  placeholder={t('invites.searchPlaceholder')}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {inviteLoading && inviteItems.length === 0 ? (
                <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-border/60 bg-background/40 px-6 py-16 text-center text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('invites.loading')}
                  </div>
                </div>
              ) : inviteError ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-background/40 px-6 py-16 text-center">
                  <AlertTriangle className="h-8 w-8 text-destructive/70" />
                  <div className="space-y-1">
                    <p className="font-semibold text-destructive">{t('invites.loadErrorTitle')}</p>
                    <p className="text-sm text-muted-foreground">{inviteError}</p>
                  </div>
                  <Button variant="outline" onClick={() => void refreshInvites()}>
                    {t('invites.retry')}
                  </Button>
                </div>
              ) : inviteItems.length > 0 ? (
                <>
                  <div className="overflow-hidden rounded-2xl border border-border/60">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="hover:bg-transparent">
                          <TableHead>{t('invites.columns.email')}</TableHead>
                          <TableHead>{t('invites.columns.joinedAt')}</TableHead>
                          <TableHead>{t('invites.columns.status')}</TableHead>
                          <TableHead className="text-right">{t('invites.columns.commission')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inviteItems.map((item) => (
                          <TableRow key={item.invite_id}>
                            <TableCell className="font-medium">{item.invitee_email_masked}</TableCell>
                            <TableCell className="text-muted-foreground">{item.bound_at}</TableCell>
                            <TableCell>
                              <Badge className={getInviteStatusClasses(item.status)}>
                                {t(`invites.statuses.${item.status}`)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatMoney(item.commission_total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-border/60 pt-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>
                        {t('pagination.summary', { total: inviteTotal, page: invitePage, totalPages: inviteTotalPages })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{t('pagination.perPage')}</span>
                        <Select
                          value={String(invitePageSize)}
                          onValueChange={(value) => {
                            setInvitePage(1);
                            setInvitePageSize(Number(value));
                          }}
                        >
                          <SelectTrigger className="h-9 w-[90px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAGE_SIZE_OPTIONS.map((size) => (
                              <SelectItem key={size} value={String(size)}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={invitePage <= 1 || inviteLoading}
                        onClick={() => setInvitePage((current) => Math.max(1, current - 1))}
                      >
                        {t('pagination.previous')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={invitePage >= inviteTotalPages || inviteLoading}
                        onClick={() => setInvitePage((current) => Math.min(inviteTotalPages, current + 1))}
                      >
                        {t('pagination.next')}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-background/40 px-6 py-16 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/60" />
                  <div className="space-y-1">
                    <p className="font-semibold">{t('invites.emptyTitle')}</p>
                    <p className="text-sm text-muted-foreground">{t('invites.emptyDescription')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-0">
          <Card className="border border-border/60 bg-card/70">
            <CardHeader className="space-y-4">
              <div className="space-y-2">
                <CardTitle className="text-xl">{t('orders.title')}</CardTitle>
                <CardDescription>{t('orders.description')}</CardDescription>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {orderStatusOptions.map((status) => (
                    <Button
                      key={status}
                      type="button"
                      variant={orderStatusFilter === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setOrderPage(1);
                        setOrderStatusFilter(status);
                      }}
                    >
                      {status === 'all' ? t('orders.filters.all') : t(`orders.statuses.${status}`)}
                    </Button>
                  ))}
                </div>

                <Select
                  value={String(orderPageSize)}
                  onValueChange={(value) => {
                    setOrderPage(1);
                    setOrderPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="h-9 w-full sm:w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {t('pagination.pageSizeOption', { size })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderLoading && orderItems.length === 0 ? (
                <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-border/60 bg-background/40 px-6 py-16 text-center text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('orders.loading')}
                  </div>
                </div>
              ) : orderError ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-background/40 px-6 py-16 text-center">
                  <AlertTriangle className="h-8 w-8 text-destructive/70" />
                  <div className="space-y-1">
                    <p className="font-semibold text-destructive">{t('orders.loadErrorTitle')}</p>
                    <p className="text-sm text-muted-foreground">{orderError}</p>
                  </div>
                  <Button variant="outline" onClick={() => void refreshOrders()}>
                    {t('orders.retry')}
                  </Button>
                </div>
              ) : orderItems.length > 0 ? (
                <>
                  <div className="overflow-hidden rounded-2xl border border-border/60">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="hover:bg-transparent">
                          <TableHead>{t('orders.columns.orderId')}</TableHead>
                          <TableHead>{t('orders.columns.customer')}</TableHead>
                          <TableHead>{t('orders.columns.orderAmount')}</TableHead>
                          <TableHead>{t('orders.columns.commission')}</TableHead>
                          <TableHead>{t('orders.columns.confirmedAt')}</TableHead>
                          <TableHead className="text-right">{t('orders.columns.status')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item) => (
                          <TableRow key={item.commission_id}>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {item.order_no || '--'}
                            </TableCell>
                            <TableCell className="font-medium">{item.invitee_email_masked}</TableCell>
                            <TableCell>{formatMoney(item.payment_amount)}</TableCell>
                            <TableCell className="font-semibold text-green-500">
                              {formatMoney(item.commission_amount)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{item.payment_completed_at}</TableCell>
                            <TableCell className="text-right">
                              <Badge className={getOrderStatusClasses(item.status)}>
                                {t(`orders.statuses.${item.status}`)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-border/60 pt-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="text-sm text-muted-foreground">
                      {t('pagination.summary', { total: orderTotal, page: orderPage, totalPages: orderTotalPages })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={orderPage <= 1 || orderLoading}
                        onClick={() => setOrderPage((current) => Math.max(1, current - 1))}
                      >
                        {t('pagination.previous')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={orderPage >= orderTotalPages || orderLoading}
                        onClick={() => setOrderPage((current) => Math.min(orderTotalPages, current + 1))}
                      >
                        {t('pagination.next')}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-background/40 px-6 py-16 text-center">
                  <ListOrdered className="h-10 w-10 text-muted-foreground/60" />
                  <div className="space-y-1">
                    <p className="font-semibold">{t('orders.emptyTitle')}</p>
                    <p className="text-sm text-muted-foreground">{t('orders.emptyDescription')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="mt-0 space-y-6">
          <Card className="border border-border/60 bg-card/70">
            <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('withdrawals.summary.availableBalance')}
                  </p>
                  <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                    {formatMoney(displaySettlementSummary?.withdrawable_amount)}
                  </p>
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">{t('withdrawals.description')}</p>
                {!displaySettlementSummary?.button_enabled && displaySettlementSummary?.button_disabled_reason ? (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">{t('withdrawals.disabledReasonLabel')}</span>{' '}
                    {displaySettlementSummary.button_disabled_reason}
                  </p>
                ) : null}
              </div>
              <Button
                className="rounded-xl"
                disabled={!displaySettlementSummary?.button_enabled || settlementLoading}
                onClick={openSettlementDialog}
              >
                {t('withdrawals.requestAction')}
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                key: 'minimumPayout',
                value: formatMoney(displaySettlementSummary?.min_withdraw_amount),
              },
              {
                key: 'payoutSchedule',
                value: t(`withdrawals.scheduleValues.${displaySettlementSummary?.settlement_cycle || 'monthly'}`),
              },
              {
                key: 'supportedMethods',
                value: supportedMethodsLabel,
              },
            ].map((item) => (
              <div key={item.key} className="rounded-2xl border border-border/60 bg-card/70 px-4 py-4">
                <p className="text-sm font-medium text-muted-foreground">
                  {t(`withdrawals.summary.${item.key}`)}
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            {t('withdrawals.helper')}
          </div>

          <Card className="border border-border/60 bg-card/70">
            <CardHeader className="space-y-4">
              <div className="space-y-2">
                <CardTitle className="text-xl">{t('withdrawals.title')}</CardTitle>
                <CardDescription>{t('withdrawals.historyDescription')}</CardDescription>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {settlementStatusOptions.map((status) => (
                    <Button
                      key={status}
                      type="button"
                      variant={settlementStatusFilter === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSettlementPage(1);
                        setSettlementStatusFilter(status);
                      }}
                    >
                      {status === 'all'
                        ? t('withdrawals.filters.all')
                        : t(`withdrawals.statuses.${status}`)}
                    </Button>
                  ))}
                </div>

                <Select
                  value={String(settlementPageSize)}
                  onValueChange={(value) => {
                    setSettlementPage(1);
                    setSettlementPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="h-9 w-full sm:w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {t('pagination.pageSizeOption', { size })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {settlementLoading && settlementItems.length === 0 ? (
                <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-border/60 bg-background/40 px-6 py-16 text-center text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('withdrawals.loading')}
                  </div>
                </div>
              ) : settlementError ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-background/40 px-6 py-16 text-center">
                  <AlertTriangle className="h-8 w-8 text-destructive/70" />
                  <div className="space-y-1">
                    <p className="font-semibold text-destructive">{t('withdrawals.loadErrorTitle')}</p>
                    <p className="text-sm text-muted-foreground">{settlementError}</p>
                  </div>
                  <Button variant="outline" onClick={() => void refreshSettlements()}>
                    {t('withdrawals.retry')}
                  </Button>
                </div>
              ) : settlementItems.length > 0 ? (
                <>
                  <div className="overflow-hidden rounded-2xl border border-border/60">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="hover:bg-transparent">
                          <TableHead>{t('withdrawals.columns.amount')}</TableHead>
                          <TableHead>{t('withdrawals.columns.method')}</TableHead>
                          <TableHead>{t('withdrawals.columns.requestedAt')}</TableHead>
                          <TableHead className="text-right">{t('withdrawals.columns.status')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settlementItems.map((item) => (
                          <TableRow key={item.settlement_request_id}>
                            <TableCell className="font-semibold">{formatMoney(getSettlementRecordAmount(item))}</TableCell>
                            <TableCell>{t(`withdrawals.methodValues.${item.method}`)}</TableCell>
                            <TableCell className="text-muted-foreground">{item.applied_at}</TableCell>
                            <TableCell className="text-right">
                              <Badge className={getSettlementStatusClasses(item.status)}>
                                {t(`withdrawals.statuses.${item.status}`)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-border/60 pt-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="text-sm text-muted-foreground">
                      {t('pagination.summary', {
                        total: settlementTotal,
                        page: settlementPage,
                        totalPages: settlementTotalPages,
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={settlementPage <= 1 || settlementLoading}
                        onClick={() => setSettlementPage((current) => Math.max(1, current - 1))}
                      >
                        {t('pagination.previous')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={settlementPage >= settlementTotalPages || settlementLoading}
                        onClick={() => setSettlementPage((current) => Math.min(settlementTotalPages, current + 1))}
                      >
                        {t('pagination.next')}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-background/40 px-6 py-16 text-center">
                  <CreditCard className="h-10 w-10 text-muted-foreground/60" />
                  <div className="space-y-1">
                    <p className="font-semibold">{t('withdrawals.emptyTitle')}</p>
                    <p className="text-sm text-muted-foreground">{t('withdrawals.emptyDescription')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="mt-0 space-y-6">
          <Card className="border border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="text-xl">{t('faq.title')}</CardTitle>
              <CardDescription>{t('faq.description')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              {['commission', 'payout', 'fraud', 'review'].map((itemKey) => (
                <div key={itemKey} className="rounded-2xl border border-border/60 bg-background/40 p-5">
                  <p className="font-semibold">{t(`faq.items.${itemKey}.question`)}</p>
                  <Separator className="my-4" />
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t(`faq.items.${itemKey}.answer`)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-xl font-semibold">{t('faq.supportTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('faq.supportDescription')}</p>
              </div>
              <Button asChild className="rounded-xl">
                <Link href="/support">{t('faq.supportAction')}</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={isApplicationFormOpen}
        onOpenChange={(open) => {
          if (isSubmittingApplication || isUploadingProof) {
            return;
          }

          setIsApplicationFormOpen(open);
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-[860px] flex-col gap-0 overflow-hidden border-border/60 bg-background p-0">
          <DialogHeader className="border-b border-border/60 px-6 py-5">
            <DialogTitle className="text-2xl">{t('application.form.title')}</DialogTitle>
            <DialogDescription>{t('application.form.description')}</DialogDescription>
          </DialogHeader>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleApplicationSubmit}>
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5 pb-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  {t('application.form.channelLabel')} <span className="text-destructive">*</span>
                </Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {applicationChannelOptions.map((option) => {
                    const checked = applicationDraft.channelTypes.includes(option);

                    return (
                      <label
                        key={option}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-4 transition-colors',
                          checked
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border/60 bg-background/50 hover:border-primary/40'
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => handleChannelToggle(option, value === true)}
                        />
                        <span className="font-medium">{t(`application.channels.${option}`)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">
                    {t('application.form.accountLinksLabel')} <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">{t('application.form.accountLinksDescription')}</p>
                </div>
                <div className="space-y-3">
                  {applicationDraft.accountLinks.map((accountLink, index) => (
                    <div key={`account-link-${index}`} className="flex items-center gap-2">
                      <Input
                        value={accountLink}
                        onChange={(event) => handleAccountLinkChange(index, event.target.value)}
                        placeholder={t('application.form.accountLinksPlaceholder')}
                        className="h-11"
                      />
                      {applicationDraft.accountLinks.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => handleRemoveAccountLink(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto px-0 text-primary hover:bg-transparent hover:text-primary/90"
                  onClick={handleAddAccountLink}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('application.form.addAccountLink')}
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">
                    {t('application.form.proofLabel')} <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">{t('application.form.proofDescription')}</p>
                </div>
                <input
                  ref={proofInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={handleProofUpload}
                />
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20">
                  {proofPreviewUrl ? (
                    <div className="space-y-4 p-4">
                      <div className="overflow-hidden rounded-xl border border-border/60 bg-background/70">
                        <img
                          src={proofPreviewUrl}
                          alt={applicationDraft.proofImageName || 'Proof preview'}
                          className="max-h-[320px] w-full object-contain"
                        />
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{applicationDraft.proofImageName}</p>
                          <p className="text-sm text-muted-foreground">
                            {applicationDraft.proofImageSize > 0
                              ? formatFileSize(applicationDraft.proofImageSize)
                              : t('application.form.proofHint')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => proofInputRef.current?.click()}
                            disabled={isUploadingProof || isSubmittingApplication}
                          >
                            {t('application.form.replaceProof')}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleRemoveProof}
                            disabled={isUploadingProof || isSubmittingApplication}
                          >
                            {t('application.form.removeProof')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="flex w-full flex-col items-center justify-center gap-2 px-6 py-12 text-center transition-colors hover:bg-muted/30"
                      onClick={() => proofInputRef.current?.click()}
                      disabled={isUploadingProof || isSubmittingApplication}
                    >
                      {isUploadingProof ? (
                        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                      ) : (
                        <Upload className="h-10 w-10 text-muted-foreground" />
                      )}
                      <div className="space-y-1">
                        <p className="font-medium">{t('application.form.proofAction')}</p>
                        <p className="text-sm text-muted-foreground">{t('application.form.proofHint')}</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="affiliate-plan" className="text-sm font-semibold">
                      {t('application.form.planLabel')} <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground">{t('application.form.planDescription')}</p>
                  </div>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {applicationDraft.promotionPlan.length} / {MAX_PROMOTION_PLAN_LENGTH}
                  </span>
                </div>
                <Textarea
                  id="affiliate-plan"
                  rows={6}
                  maxLength={MAX_PROMOTION_PLAN_LENGTH}
                  value={applicationDraft.promotionPlan}
                  onChange={(event) => handleDraftChange('promotionPlan', event.target.value)}
                  placeholder={t('application.form.planPlaceholder')}
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="affiliate-contact" className="text-sm font-semibold">
                    {t('application.form.contactLabel')} <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">{t('application.form.contactDescription')}</p>
                </div>
                <Input
                  id="affiliate-contact"
                  value={applicationDraft.contactInfo}
                  onChange={(event) => handleDraftChange('contactInfo', event.target.value)}
                  placeholder={t('application.form.contactPlaceholder')}
                  className="h-11"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="affiliate-notes" className="text-sm font-semibold">
                    {t('application.form.notesLabel')}
                  </Label>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {applicationDraft.additionalNotes.length} / {MAX_ADDITIONAL_NOTES_LENGTH}
                  </span>
                </div>
                <Textarea
                  id="affiliate-notes"
                  rows={4}
                  maxLength={MAX_ADDITIONAL_NOTES_LENGTH}
                  value={applicationDraft.additionalNotes}
                  onChange={(event) => handleDraftChange('additionalNotes', event.target.value)}
                  placeholder={t('application.form.notesPlaceholder')}
                />
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-border/60 bg-background/95 px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={isSubmittingApplication || isUploadingProof}
                onClick={() => setIsApplicationFormOpen(false)}
              >
                {t('application.form.cancel')}
              </Button>
              <Button type="submit" className="rounded-xl" disabled={isSubmittingApplication || isUploadingProof}>
                {isSubmittingApplication ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('application.form.submitting')}
                  </>
                ) : programStatus === 'rejected' ? (
                  t('application.form.resubmit')
                ) : (
                  t('application.form.submit')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSettlementDialogOpen}
        onOpenChange={(open) => {
          if (isSubmittingSettlement) {
            return;
          }

          setIsSettlementDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t('withdrawals.requestDialog.title')}</DialogTitle>
            <DialogDescription>{t('withdrawals.requestDialog.description')}</DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSettlementSubmit}>
            <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              <p>
                {t('withdrawals.requestDialog.fullAmountNotice', {
                  amount: formatMoney(displaySettlementSummary?.withdrawable_amount),
                })}
              </p>
              <p className="mt-1">{t('withdrawals.requestDialog.manualTransferNote')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="settlement-method">{t('withdrawals.requestDialog.methodLabel')}</Label>
              <Select
                value={settlementMethod}
                onValueChange={(value) => setSettlementMethod(value as AffiliateSettlementMethod)}
              >
                <SelectTrigger id="settlement-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedSettlementMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {t(`withdrawals.methodValues.${method}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination-account">{t('withdrawals.requestDialog.accountLabel')}</Label>
              <Input
                id="destination-account"
                value={settlementDestinationAccount}
                onChange={(event) => setSettlementDestinationAccount(event.target.value)}
                placeholder={t(`withdrawals.requestDialog.accountPlaceholders.${settlementMethod}`)}
              />
            </div>

            <DialogFooter className="sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSettlementDialogOpen(false)}
                disabled={isSubmittingSettlement}
              >
                {t('withdrawals.requestDialog.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmittingSettlement}>
                {isSubmittingSettlement ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('withdrawals.requestDialog.submitting')}
                  </>
                ) : (
                  t('withdrawals.requestDialog.submit')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

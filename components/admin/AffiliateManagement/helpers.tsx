import type { ReactNode } from 'react';

import type {
  AffiliateAdminCommissionStage,
  AffiliateAdminSettlementSafetyStatus,
  AffiliateAdminSettlementStatus,
  AffiliateApplicationStatus,
  AffiliatePrimaryStatus,
  AffiliateSettlementMethod,
  AffiliateStatusTag,
} from '@/components/dashboard/affiliate/types';
import { Badge } from '@/components/ui/badge';

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numericValue = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return moneyFormatter.format(numericValue);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(size: number | null | undefined) {
  if (!size) {
    return '-';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatNullableText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '-';
}

export function formatManualRateBps(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return '-';
  }

  return `${value} bps (${(value / 100).toFixed(2)}%)`;
}

export function isNotFoundLikeError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const status = (error as Error & { status?: number }).status;
  const message = error.message.toLowerCase();

  return status === 404 || message.includes('not found');
}

export function getApplicationStatusMeta(status: AffiliateApplicationStatus) {
  switch (status) {
    case 'approved':
      return { label: '已通过', className: 'border-green-500/20 bg-green-500/10 text-green-600' };
    case 'rejected':
      return { label: '已驳回', className: 'border-destructive/20 bg-destructive/10 text-destructive' };
    default:
      return { label: '待审核', className: 'border-amber-500/20 bg-amber-500/10 text-amber-600' };
  }
}

export function getPrimaryStatusMeta(status: AffiliatePrimaryStatus | null | undefined) {
  switch (status) {
    case 'active':
      return { label: '正常合作', className: 'border-green-500/20 bg-green-500/10 text-green-600' };
    case 'suspended':
      return { label: '暂停资格', className: 'border-amber-500/20 bg-amber-500/10 text-amber-600' };
    case 'banned':
      return { label: '已封禁', className: 'border-destructive/20 bg-destructive/10 text-destructive' };
    case 'inactive':
      return { label: '未激活', className: 'border-border bg-muted/50 text-muted-foreground' };
    default:
      return { label: '未知状态', className: 'border-border bg-muted/50 text-muted-foreground' };
  }
}

export function getStatusTagMeta(tag: AffiliateStatusTag) {
  switch (tag) {
    case 'new_joined':
      return { label: '新加入', className: 'border-blue-500/20 bg-blue-500/10 text-blue-600' };
    case 'watchlist':
      return { label: '观察名单', className: 'border-amber-500/20 bg-amber-500/10 text-amber-600' };
    default:
      return { label: tag, className: 'border-border bg-muted/50 text-muted-foreground' };
  }
}

export function getCommissionStageMeta(stage: AffiliateAdminCommissionStage) {
  switch (stage) {
    case 'releasable':
      return { label: '可提现', className: 'border-green-500/20 bg-green-500/10 text-green-600' };
    case 'locked':
      return { label: '提现处理中', className: 'border-blue-500/20 bg-blue-500/10 text-blue-600' };
    case 'risk_frozen':
      return { label: '风控冻结', className: 'border-destructive/20 bg-destructive/10 text-destructive' };
    case 'paid':
      return { label: '已打款', className: 'border-border bg-muted/50 text-muted-foreground' };
    case 'reversed':
      return { label: '已冲销', className: 'border-destructive/20 bg-destructive/10 text-destructive' };
    default:
      return { label: '冻结中', className: 'border-amber-500/20 bg-amber-500/10 text-amber-600' };
  }
}

export function getSettlementStatusMeta(status: AffiliateAdminSettlementStatus) {
  switch (status) {
    case 'approved':
      return { label: '待打款', className: 'border-green-500/20 bg-green-500/10 text-green-600' };
    case 'processing':
      return { label: '打款中', className: 'border-blue-500/20 bg-blue-500/10 text-blue-600' };
    case 'paid':
      return { label: '已打款', className: 'border-border bg-muted/50 text-muted-foreground' };
    case 'rejected':
      return { label: '已驳回', className: 'border-destructive/20 bg-destructive/10 text-destructive' };
    case 'cancelled':
      return { label: '已取消', className: 'border-border bg-muted/50 text-muted-foreground' };
    default:
      return { label: '待审核', className: 'border-amber-500/20 bg-amber-500/10 text-amber-600' };
  }
}

export function getSafetyStatusMeta(status: AffiliateAdminSettlementSafetyStatus) {
  switch (status) {
    case 'passed':
      return { label: '安全通过', className: 'border-green-500/20 bg-green-500/10 text-green-600' };
    case 'manual_review':
      return { label: '人工复核', className: 'border-blue-500/20 bg-blue-500/10 text-blue-600' };
    case 'blocked':
      return { label: '已拦截', className: 'border-destructive/20 bg-destructive/10 text-destructive' };
    default:
      return { label: '待安全结论', className: 'border-amber-500/20 bg-amber-500/10 text-amber-600' };
  }
}

export function getSettlementMethodLabel(method: AffiliateSettlementMethod) {
  switch (method) {
    case 'wechat':
      return '微信';
    default:
      return 'Stripe';
  }
}

export function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2 break-all text-sm font-medium">{value}</div>
    </div>
  );
}

export function StatusTagBadges({ tags }: { tags?: AffiliateStatusTag[] | null }) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <>
      {tags.map((tag) => {
        const meta = getStatusTagMeta(tag);
        return (
          <Badge key={tag} className={meta.className}>
            {meta.label}
          </Badge>
        );
      })}
    </>
  );
}

'use client';

import { Copy, Loader2, RefreshCw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  DetailField,
  StatusTagBadges,
  formatDateTime,
  formatMoney,
  formatNullableText,
  getApplicationStatusMeta,
  getPrimaryStatusMeta,
  getSettlementMethodLabel,
} from '@/components/admin/AffiliateManagement/helpers';
import { useAffiliateAdminPartners } from '@/components/admin/AffiliateManagement/useAffiliateAdminPartners';
import type {
  PartnerPrimaryStatusFilter,
  PartnerStatusTagFilter,
} from '@/components/admin/AffiliateManagement/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { AffiliateAdminPartnerManagedStatus } from '@/components/dashboard/affiliate/types';
import { cn } from '@/lib/utils';

const primaryStatusOptions: Array<{ value: PartnerPrimaryStatusFilter; label: string }> = [
  { value: 'all', label: '全部主状态' },
  { value: 'inactive', label: '未激活' },
  { value: 'active', label: '正常合作' },
  { value: 'suspended', label: '暂停资格' },
  { value: 'banned', label: '已封禁' },
];

const statusTagOptions: Array<{ value: PartnerStatusTagFilter; label: string }> = [
  { value: 'all', label: '全部标签' },
  { value: 'new_joined', label: '新加入' },
  { value: 'watchlist', label: '观察名单' },
];

const partnerStatusOptions: Array<{
  value: AffiliateAdminPartnerManagedStatus;
  label: string;
}> = [
  { value: 'active', label: '正常合作' },
  { value: 'suspended', label: '暂停资格' },
  { value: 'banned', label: '封禁' },
];

function getEditablePartnerStatus(
  status: string | null | undefined
): AffiliateAdminPartnerManagedStatus {
  if (status === 'suspended' || status === 'banned') {
    return status;
  }

  return 'active';
}

export default function AffiliatePartnersTab({
  onTotalChange,
  vendorCode,
}: {
  onTotalChange?: (total: number) => void;
  vendorCode?: string;
}) {
  const {
    page,
    pageSize,
    total,
    totalPages,
    items,
    listLoading,
    listError,
    detail,
    detailLoading,
    detailError,
    detailOutsideFilters,
    actionSubmitting,
    actionError,
    selectedPromoterId,
    primaryStatusFilter,
    statusTagFilter,
    keyword,
    setPage,
    setPageSize,
    setPrimaryStatusFilter,
    setStatusTagFilter,
    setKeyword,
    setSelectedPromoterId,
    refreshCurrentData,
    updatePartnerStatus,
    updatePartnerWatchlist,
    clearActionError,
  } = useAffiliateAdminPartners(onTotalChange, vendorCode);

  const [managedStatus, setManagedStatus] =
    useState<AffiliateAdminPartnerManagedStatus>('active');
  const [watchlistEnabled, setWatchlistEnabled] = useState(false);
  const [watchlistNote, setWatchlistNote] = useState('');
  const [statusValidationError, setStatusValidationError] = useState<string | null>(null);
  const [watchlistValidationError, setWatchlistValidationError] = useState<string | null>(null);
  const [actionContext, setActionContext] = useState<'status' | 'watchlist' | null>(null);

  const canEditStatus =
    detail?.latest_application?.application_status === 'approved';
  const currentManagedStatus = detail
    ? getEditablePartnerStatus(detail.primary_status)
    : 'active';
  const currentWatchlistState = Boolean(detail?.latest_application?.is_watchlist);
  const statusVisibleError = actionContext === 'status'
    ? statusValidationError ?? actionError
    : statusValidationError;
  const watchlistVisibleError = actionContext === 'watchlist'
    ? watchlistValidationError ?? actionError
    : watchlistValidationError;

  useEffect(() => {
    if (!detail) {
      setManagedStatus('active');
      setWatchlistEnabled(false);
      setWatchlistNote('');
      setStatusValidationError(null);
      setWatchlistValidationError(null);
      setActionContext(null);
      return;
    }

    setManagedStatus(getEditablePartnerStatus(detail.primary_status));
    setWatchlistEnabled(Boolean(detail.latest_application?.is_watchlist));
    setWatchlistNote(detail.latest_application?.watchlist_note ?? '');
    setStatusValidationError(null);
    setWatchlistValidationError(null);
    setActionContext(null);
  }, [detail]);

  const handleCopy = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error('复制失败，请稍后重试');
    }
  };

  const handleStatusSubmit = async () => {
    if (!detail || !canEditStatus || managedStatus === currentManagedStatus) {
      return;
    }

    clearActionError();
    setActionContext('status');
    setStatusValidationError(null);
    setWatchlistValidationError(null);

    try {
      await updatePartnerStatus(detail.promoter_user_id, {
        affiliate_status: managedStatus,
      });
      toast.success('推广员状态已更新');
    } catch (error) {
      setManagedStatus(currentManagedStatus);
      toast.error(error instanceof Error ? error.message : '更新推广员状态失败');
    }
  };

  const handleWatchlistSubmit = async (nextEnabled: boolean, nextNote: string) => {
    if (!detail) {
      return;
    }

    clearActionError();
    setActionContext('watchlist');
    setStatusValidationError(null);
    setWatchlistValidationError(null);

    if (nextEnabled && !nextNote.trim()) {
      setWatchlistValidationError('观察名单备注不能为空');
      return;
    }

    try {
      await updatePartnerWatchlist(detail.promoter_user_id, {
        is_watchlist: nextEnabled,
        watchlist_note: nextEnabled ? nextNote : '',
      });
      toast.success(nextEnabled ? '已加入观察名单' : '已移出观察名单');
    } catch (error) {
      setWatchlistEnabled(Boolean(detail.latest_application?.is_watchlist));
      setWatchlistNote(detail.latest_application?.watchlist_note ?? '');
      toast.error(error instanceof Error ? error.message : '更新观察名单失败');
    }
  };

  const handleWatchlistToggle = async (checked: boolean) => {
    clearActionError();
    setActionContext('watchlist');
    setWatchlistValidationError(null);

    if (checked) {
      setWatchlistEnabled(true);
      return;
    }

    setWatchlistEnabled(false);
    setWatchlistNote('');

    if (!currentWatchlistState) {
      return;
    }

    await handleWatchlistSubmit(false, '');
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="border border-border/60 bg-card/80">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">推广员管理</CardTitle>
              <CardDescription>这里是合作名册，不再承载冗余财务拆分字段。</CardDescription>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
              <div className="relative min-w-0 flex-1 xl:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索推广员 / 邮箱 / 邀请码"
                  className="pl-9"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => void refreshCurrentData()}
                disabled={listLoading || detailLoading || actionSubmitting}
              >
                <RefreshCw
                  className={cn(
                    'mr-2 h-4 w-4',
                    (listLoading || detailLoading || actionSubmitting) && 'animate-spin'
                  )}
                />
                刷新
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="shrink-0 text-sm text-muted-foreground">主状态</span>
              <Select
                value={primaryStatusFilter}
                onValueChange={(value) =>
                  setPrimaryStatusFilter(value as PartnerPrimaryStatusFilter)
                }
              >
                <SelectTrigger className="w-full xl:max-w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {primaryStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="shrink-0 text-sm text-muted-foreground">标签</span>
              <Select
                value={statusTagFilter}
                onValueChange={(value) =>
                  setStatusTagFilter(value as PartnerStatusTagFilter)
                }
              >
                <SelectTrigger className="w-full xl:max-w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusTagOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {listError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {listError}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead>推广员</TableHead>
                  <TableHead>邀请码</TableHead>
                  <TableHead>邀请数</TableHead>
                  <TableHead>累计佣金</TableHead>
                  <TableHead className="text-right">合作状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-6 py-16 text-center text-sm text-muted-foreground">
                      <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
                      正在加载推广员列表...
                    </TableCell>
                  </TableRow>
                ) : items.length > 0 ? (
                  items.map((item) => {
                    const selected = selectedPromoterId === item.promoter_user_id;
                    const primaryMeta = getPrimaryStatusMeta(item.primary_status);

                    return (
                      <TableRow
                        key={item.promoter_user_id}
                        className={cn(
                          'cursor-pointer hover:bg-muted/20',
                          selected && 'bg-primary/5'
                        )}
                        onClick={() => setSelectedPromoterId(item.promoter_user_id)}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{item.promoter_name || '-'}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.promoter_email || '-'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="border border-border bg-muted/50 font-mono text-muted-foreground">
                            {item.invite_code || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.invite_count}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatMoney(item.total_commission)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Badge className={primaryMeta.className}>{primaryMeta.label}</Badge>
                            <StatusTagBadges tags={item.status_tags} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="px-6 py-16 text-center text-sm text-muted-foreground">
                      当前筛选条件下没有推广员记录。
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/60 pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>共 {total} 条</span>
              <span>
                第 {page} / {totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <span>每页</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger className="h-9 w-[90px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[20, 50, 100].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Pagination className="mx-0 w-auto justify-start lg:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (page > 1) {
                        setPage(page - 1);
                      }
                    }}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (page < totalPages) {
                        setPage(page + 1);
                      }
                    }}
                    className={
                      page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-xl">推广员详情</CardTitle>
          <CardDescription>默认收款方式、联系方式和最近申请记录都放在详情区域查看。</CardDescription>
        </CardHeader>

        <CardContent>
          {detailLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
              正在加载推广员详情...
            </div>
          ) : detailError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {detailError}
            </div>
          ) : detail ? (
            <div className="space-y-4">
              {detailOutsideFilters ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                  该推广员已不在当前筛选结果中。
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">{detail.promoter_name || '-'}</h3>
                <Badge className={getPrimaryStatusMeta(detail.primary_status).className}>
                  {getPrimaryStatusMeta(detail.primary_status).label}
                </Badge>
                <StatusTagBadges tags={detail.status_tags} />
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row">
                  <Input
                    readOnly
                    value={detail.share_url || '当前没有可用推广链接'}
                    className="h-11 border-border/60 bg-background/60 font-medium"
                  />
                  <Button
                    className="h-11 min-w-[140px]"
                    disabled={!detail.share_url}
                    onClick={() =>
                      detail.share_url &&
                      void handleCopy(detail.share_url, '推广链接已复制')
                    }
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    复制链接
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="推广员邮箱" value={detail.promoter_email || '-'} />
                <DetailField label="邀请码" value={detail.invite_code || '-'} />
                <DetailField label="邀请数" value={detail.invite_count} />
                <DetailField label="累计佣金" value={formatMoney(detail.total_commission)} />
                <DetailField
                  label="默认收款方式"
                  value={getSettlementMethodLabel(detail.preferred_settlement_method)}
                />
                <DetailField
                  label="默认收款账号"
                  value={formatNullableText(detail.preferred_destination_account_masked)}
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <div className="space-y-1">
                    <p className="font-semibold">合作状态</p>
                    <p className="text-sm text-muted-foreground">
                      当前状态只以 primary_status 为准，修改成功后以后端返回结果覆盖本地状态。
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="partner-status-select">合作状态</Label>
                      <Select
                        value={managedStatus}
                        onValueChange={(value) =>
                          setManagedStatus(value as AffiliateAdminPartnerManagedStatus)
                        }
                        disabled={!canEditStatus || actionSubmitting}
                      >
                        <SelectTrigger id="partner-status-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {partnerStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      onClick={() => void handleStatusSubmit()}
                      disabled={
                        !canEditStatus ||
                        actionSubmitting ||
                        managedStatus === currentManagedStatus
                      }
                    >
                      {actionSubmitting && actionContext === 'status' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      保存状态
                    </Button>

                    {!canEditStatus ? (
                      <p className="text-sm text-muted-foreground">
                        仅 approved partner 可修改合作状态。
                      </p>
                    ) : null}
                    {statusVisibleError ? (
                      <p className="text-sm text-destructive">{statusVisibleError}</p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold">观察名单</p>
                      <p className="text-sm text-muted-foreground">
                        打开观察名单时必须填写备注，关闭后会立即清空本地备注输入。
                      </p>
                    </div>
                    <Switch
                      checked={watchlistEnabled}
                      onCheckedChange={(checked) => void handleWatchlistToggle(checked)}
                      disabled={actionSubmitting}
                    />
                  </div>

                  {watchlistEnabled ? (
                    <div className="mt-4 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="partner-watchlist-note">观察名单备注</Label>
                        <Textarea
                          id="partner-watchlist-note"
                          rows={4}
                          value={watchlistNote}
                          onChange={(event) => {
                            clearActionError();
                            setActionContext('watchlist');
                            setWatchlistNote(event.target.value);
                            if (watchlistValidationError) {
                              setWatchlistValidationError(null);
                            }
                          }}
                          placeholder="请输入观察名单备注，例如：同设备/IP 异常，先观察后续转化"
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={() => void handleWatchlistSubmit(true, watchlistNote)}
                        disabled={actionSubmitting}
                      >
                        {actionSubmitting && actionContext === 'watchlist' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        保存观察名单
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                      当前未加入观察名单。
                    </p>
                  )}

                  {watchlistVisibleError ? (
                    <p className="mt-3 text-sm text-destructive">{watchlistVisibleError}</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">最近申请记录</p>
                  {detail.latest_application ? (
                    <Badge
                      className={
                        getApplicationStatusMeta(detail.latest_application.application_status)
                          .className
                      }
                    >
                      {
                        getApplicationStatusMeta(detail.latest_application.application_status)
                          .label
                      }
                    </Badge>
                  ) : null}
                </div>

                {detail.latest_application ? (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailField
                        label="申请单号"
                        value={detail.latest_application.application_no}
                      />
                      <DetailField
                        label="提交时间"
                        value={formatDateTime(detail.latest_application.created_at)}
                      />
                      <DetailField
                        label="联系方式"
                        value={formatNullableText(detail.latest_application.contact_info)}
                      />
                      <DetailField
                        label="人工佣金比例"
                        value={
                          detail.latest_application.manual_rate_bps === null
                            ? '-'
                            : `${detail.latest_application.manual_rate_bps} bps`
                        }
                      />
                      <DetailField
                        label="申请快照状态"
                        value={
                          getPrimaryStatusMeta(detail.latest_application.affiliate_status).label
                        }
                      />
                      <DetailField
                        label="观察名单快照"
                        value={detail.latest_application.is_watchlist ? '是' : '否'}
                      />
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium">观察名单备注</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {formatNullableText(detail.latest_application.watchlist_note)}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium">推广渠道</p>
                      <div className="flex flex-wrap gap-2">
                        {detail.latest_application.channel_types.map((channel) => (
                          <Badge
                            key={channel}
                            className="border border-border bg-muted/50 text-muted-foreground"
                          >
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium">推广计划</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {formatNullableText(detail.latest_application.promotion_plan)}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium">审核备注</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {formatNullableText(detail.latest_application.review_note)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    当前没有可展示的申请记录。
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-muted-foreground">
              请先从左侧列表选择一条推广员记录。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

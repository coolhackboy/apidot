'use client';

import { CheckCircle2, ExternalLink, Loader2, RefreshCw, Search, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import {
  DetailField,
  StatusTagBadges,
  formatDateTime,
  formatFileSize,
  formatManualRateBps,
  formatNullableText,
  getApplicationStatusMeta,
  getPrimaryStatusMeta,
} from '@/components/admin/AffiliateManagement/helpers';
import { useAffiliateAdminApplications } from '@/components/admin/AffiliateManagement/useAffiliateAdminApplications';
import type {
  AffiliateApplication,
  AffiliateApplicationStatus,
  AffiliateStatus,
} from '@/components/dashboard/affiliate/types';
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
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const REVIEW_NOTE_LIMIT = 500;

const applicationStatusOptions: Array<{ value: 'all' | AffiliateApplicationStatus; label: string }> = [
  { value: 'all', label: '全部申请' },
  { value: 'submitted', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
];

const affiliateStatusOptions: Array<{ value: 'all' | AffiliateStatus; label: string }> = [
  { value: 'all', label: '全部合作状态' },
  { value: 'inactive', label: '未激活' },
  { value: 'active', label: '正常合作' },
  { value: 'suspended', label: '暂停资格' },
  { value: 'banned', label: '已封禁' },
];

function ChannelBadges({ application }: { application: AffiliateApplication }) {
  return (
    <div className="flex flex-wrap gap-2">
      {application.channel_types.map((channel) => (
        <Badge key={channel} className="border border-border bg-muted/50 text-muted-foreground">
          {channel}
        </Badge>
      ))}
    </div>
  );
}

function StatusBadges({ application }: { application: AffiliateApplication }) {
  const applicationMeta = getApplicationStatusMeta(application.application_status);
  const primaryMeta = getPrimaryStatusMeta(application.primary_status ?? application.affiliate_status);

  return (
    <>
      <Badge className={applicationMeta.className}>{applicationMeta.label}</Badge>
      <Badge className={primaryMeta.className}>{primaryMeta.label}</Badge>
      <StatusTagBadges tags={application.status_tags} />
    </>
  );
}

export default function AffiliateApplicationsTab({
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
    selectedApplicationId,
    applicationStatus,
    affiliateStatus,
    keyword,
    reviewNote,
    manualRateBps,
    reviewSubmitting,
    hasReviewed,
    setPage,
    setPageSize,
    setApplicationStatus,
    setAffiliateStatus,
    setKeyword,
    setSelectedApplicationId,
    setReviewNote,
    setManualRateBps,
    refreshCurrentData,
    reviewApplication,
  } = useAffiliateAdminApplications(onTotalChange, vendorCode);

  const handleReview = async (action: 'approve' | 'reject') => {
    if (action === 'approve' && manualRateBps.trim() && !/^\d+$/.test(manualRateBps.trim())) {
      toast.error('人工佣金比例必须是整数 bps');
      return;
    }

    try {
      await reviewApplication(action);
      toast.success(action === 'approve' ? '申请已审核通过' : '申请已驳回');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '审核申请失败');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="border border-border/60 bg-card/80">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">申请审核</CardTitle>
              <CardDescription>左侧只保留决策字段，右侧查看材料并直接完成审核。</CardDescription>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
              <div className="relative min-w-0 flex-1 xl:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索申请单号 / 用户 ID / 邮箱 / 联系方式"
                  className="pl-9"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => void refreshCurrentData()}
                disabled={listLoading || detailLoading}
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', (listLoading || detailLoading) && 'animate-spin')} />
                刷新
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {applicationStatusOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={applicationStatus === option.value ? 'secondary' : 'ghost'}
                  className={cn(
                    'rounded-full',
                    applicationStatus === option.value && 'bg-primary/15 text-primary hover:bg-primary/20'
                  )}
                  onClick={() => setApplicationStatus(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {affiliateStatusOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={affiliateStatus === option.value ? 'secondary' : 'ghost'}
                  className={cn(
                    'rounded-full',
                    affiliateStatus === option.value && 'bg-primary/15 text-primary hover:bg-primary/20'
                  )}
                  onClick={() => setAffiliateStatus(option.value)}
                >
                  {option.label}
                </Button>
              ))}
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
                  <TableHead>申请单号</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>渠道</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead className="text-right">状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-16 text-center text-sm text-muted-foreground">
                      <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
                      正在加载申请列表...
                    </TableCell>
                  </TableRow>
                ) : items.length > 0 ? (
                  items.map((item) => {
                    const selected = selectedApplicationId === item.id;

                    return (
                      <TableRow
                        key={item.id}
                        className={cn('cursor-pointer hover:bg-muted/20', selected && 'bg-primary/5')}
                        onClick={() => setSelectedApplicationId(item.id)}
                      >
                        <TableCell className="font-mono text-xs">{item.application_no}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{item.user_email_snapshot}</p>
                            <p className="text-xs text-muted-foreground">UID {item.user_id}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{item.channel_types.join(', ') || '-'}</TableCell>
                        <TableCell className="max-w-[180px] truncate text-sm">
                          {formatNullableText(item.contact_info)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDateTime(item.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <StatusBadges application={item} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-16 text-center text-sm text-muted-foreground">
                      当前筛选条件下没有申请记录。
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
                <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
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
                      if (page > 1) setPage(page - 1);
                    }}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (page < totalPages) setPage(page + 1);
                    }}
                    className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-xl">申请详情</CardTitle>
          <CardDescription>推广计划、证明材料和审核备注都放在详情区域，避免挤占队列视野。</CardDescription>
        </CardHeader>

        <CardContent>
          {detailLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
              正在加载申请详情...
            </div>
          ) : detailError ? (
            <div className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{detailError}</p>
              <Button type="button" variant="outline" onClick={() => void refreshCurrentData()}>
                重新加载
              </Button>
            </div>
          ) : detail ? (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{detail.application_no}</h3>
                  <StatusBadges application={detail} />
                </div>
                <p className="text-sm text-muted-foreground">{detail.user_email_snapshot}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="用户 ID" value={detail.user_id} />
                <DetailField label="站点标识" value={detail.vendor_code} />
                <DetailField label="人工佣金比例" value={formatManualRateBps(detail.manual_rate_bps)} />
                <DetailField label="联系方式" value={formatNullableText(detail.contact_info)} />
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                <p className="font-semibold">推广渠道</p>
                <div className="mt-3">
                  <ChannelBadges application={detail} />
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                <p className="font-semibold">账号链接</p>
                <div className="mt-3 space-y-2">
                  {detail.account_links.length > 0 ? (
                    detail.account_links.map((link) => (
                      <a
                        key={link}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 break-all text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4 shrink-0" />
                        {link}
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">未提供账号链接</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                <p className="font-semibold">推广计划</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{formatNullableText(detail.promotion_plan)}</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                <p className="font-semibold">补充说明</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{formatNullableText(detail.additional_notes)}</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">证明材料</p>
                  {detail.proof_image_url ? (
                    <a
                      href={detail.proof_image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      查看原图
                    </a>
                  ) : null}
                </div>

                {detail.proof_image_url ? (
                  <a href={detail.proof_image_url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={detail.proof_image_url}
                      alt={detail.proof_image_name || detail.application_no}
                      className="mt-4 max-h-72 w-full rounded-xl border border-border/60 object-contain"
                    />
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">未提供截图</p>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <DetailField label="文件名" value={formatNullableText(detail.proof_image_name)} />
                  <DetailField label="文件大小" value={formatFileSize(detail.proof_image_size)} />
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                <p className="font-semibold">审核信息</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <DetailField label="审核备注" value={formatNullableText(detail.review_note)} />
                  <DetailField label="审核人 UID" value={detail.reviewed_by_uid ?? '-'} />
                  <DetailField label="创建时间" value={formatDateTime(detail.created_at)} />
                  <DetailField label="审核时间" value={formatDateTime(detail.reviewed_at)} />
                  <DetailField label="通过时间" value={formatDateTime(detail.approved_at)} />
                  <DetailField label="驳回时间" value={formatDateTime(detail.rejected_at)} />
                </div>
                <div className="mt-3">
                  <DetailField label="更新时间" value={formatDateTime(detail.updated_at)} />
                </div>
              </div>

              <Separator />

              {hasReviewed ? (
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                  该申请已经完成审核，当前仅展示最终状态和审核信息。
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="affiliate-review-note">审核备注</Label>
                      <span className="text-xs text-muted-foreground">
                        {reviewNote.length} / {REVIEW_NOTE_LIMIT}
                      </span>
                    </div>
                    <Textarea
                      id="affiliate-review-note"
                      rows={4}
                      maxLength={REVIEW_NOTE_LIMIT}
                      value={reviewNote}
                      onChange={(event) => setReviewNote(event.target.value)}
                      placeholder="可填写审核意见、补充说明或驳回原因"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="affiliate-manual-rate">人工佣金比例（可选）</Label>
                    <Input
                      id="affiliate-manual-rate"
                      inputMode="numeric"
                      value={manualRateBps}
                      onChange={(event) => setManualRateBps(event.target.value)}
                      placeholder="例如 1500"
                    />
                    <p className="text-xs text-muted-foreground">仅在通过时生效，1500 = 15%</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="button" onClick={() => void handleReview('approve')} disabled={reviewSubmitting}>
                      {reviewSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      通过
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => void handleReview('reject')}
                      disabled={reviewSubmitting}
                    >
                      {reviewSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      驳回
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-muted-foreground">
              请先从左侧列表选择一条申请记录。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

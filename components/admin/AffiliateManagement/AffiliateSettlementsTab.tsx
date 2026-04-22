'use client';

import { Loader2, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  DetailField,
  formatDateTime,
  formatMoney,
  formatNullableText,
  getSafetyStatusMeta,
  getSettlementMethodLabel,
  getSettlementStatusMeta,
} from '@/components/admin/AffiliateManagement/helpers';
import { useAffiliateAdminSettlements } from '@/components/admin/AffiliateManagement/useAffiliateAdminSettlements';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const NOTE_LIMIT = 500;

export default function AffiliateSettlementsTab({
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
    submitting,
    selectedSettlementId,
    queueFilter,
    queueOptions,
    keyword,
    setPage,
    setPageSize,
    setQueueFilter,
    setKeyword,
    setSelectedSettlementId,
    refreshCurrentData,
    reviewSettlement,
    updateSettlementStatus,
  } = useAffiliateAdminSettlements(onTotalChange, vendorCode);

  const [reviewNote, setReviewNote] = useState('');
  const [processNote, setProcessNote] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofName, setProofName] = useState('');
  const [proofOperatorNote, setProofOperatorNote] = useState('');

  useEffect(() => {
    setReviewNote(detail?.process_note ?? detail?.reject_reason ?? '');
    setProcessNote(detail?.process_note ?? '');
    setProofUrl(String(detail?.proof_json?.proof_items?.[0]?.url ?? ''));
    setProofName(String(detail?.proof_json?.proof_items?.[0]?.name ?? ''));
    setProofOperatorNote(String(detail?.proof_json?.operator_note ?? ''));
  }, [detail]);

  const handleReviewAction = async (action: 'approve' | 'reject' | 'manual_review' | 'block') => {
    if (!detail) return;

    try {
      await reviewSettlement({
        action,
        review_note: reviewNote.trim() || undefined,
        approved_amount: action === 'approve' ? detail.requested_amount : undefined,
      });

      toast.success(
        action === 'approve'
          ? '提现申请已审核通过'
          : action === 'reject'
            ? '提现申请已驳回'
            : action === 'manual_review'
              ? '提现申请已转入人工复核'
              : '提现申请已拦截'
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '处理提现申请失败');
    }
  };

  const handleStatusAction = async (action: 'mark_processing' | 'mark_paid') => {
    if (!detail) return;

    if (action === 'mark_paid' && !proofUrl.trim()) {
      toast.error('标记已打款时必须填写凭证地址');
      return;
    }

    try {
      await updateSettlementStatus({
        action,
        process_note: processNote.trim() || undefined,
        proof_json:
          action === 'mark_paid'
            ? {
                proof_type: 'screenshot',
                proof_items: [
                  {
                    url: proofUrl.trim(),
                    name: proofName.trim() || undefined,
                  },
                ],
                operator_note: proofOperatorNote.trim() || undefined,
              }
            : undefined,
      });

      toast.success(action === 'mark_processing' ? '提现申请已进入打款中' : '提现申请已标记为已打款');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新提现处理状态失败');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="border border-border/60 bg-card/80">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">提现审核</CardTitle>
              <CardDescription>列表围绕“是否可以打款”展开，账号、余额和凭证都在详情查看。</CardDescription>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
              <div className="relative min-w-0 flex-1 xl:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索提现单号 / 推广员 / 收款账号"
                  className="pl-9"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => void refreshCurrentData()}
                disabled={listLoading || detailLoading || submitting}
              >
                <RefreshCw
                  className={cn(
                    'mr-2 h-4 w-4',
                    (listLoading || detailLoading || submitting) && 'animate-spin'
                  )}
                />
                刷新
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {queueOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={queueFilter === option.value ? 'secondary' : 'ghost'}
                className={cn(
                  'rounded-full',
                  queueFilter === option.value && 'bg-primary/15 text-primary hover:bg-primary/20'
                )}
                onClick={() => setQueueFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
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
                  <TableHead>申请金额</TableHead>
                  <TableHead>提现方式</TableHead>
                  <TableHead>安全状态</TableHead>
                  <TableHead>申请时间</TableHead>
                  <TableHead className="text-right">提现状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-16 text-center text-sm text-muted-foreground">
                      <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
                      正在加载提现申请...
                    </TableCell>
                  </TableRow>
                ) : items.length > 0 ? (
                  items.map((item) => {
                    const selected = selectedSettlementId === item.settlement_request_id;

                    return (
                      <TableRow
                        key={item.settlement_request_id}
                        className={cn('cursor-pointer hover:bg-muted/20', selected && 'bg-primary/5')}
                        onClick={() => setSelectedSettlementId(item.settlement_request_id)}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{item.promoter_name || '-'}</p>
                            <p className="text-xs text-muted-foreground">{item.promoter_email || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{formatMoney(item.requested_amount)}</TableCell>
                        <TableCell>{getSettlementMethodLabel(item.method)}</TableCell>
                        <TableCell>
                          <Badge className={getSafetyStatusMeta(item.safety_status).className}>
                            {getSafetyStatusMeta(item.safety_status).label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDateTime(item.applied_at)}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={getSettlementStatusMeta(item.status).className}>
                            {getSettlementStatusMeta(item.status).label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-16 text-center text-sm text-muted-foreground">
                      当前筛选条件下没有提现申请。
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
          <CardTitle className="text-xl">提现详情</CardTitle>
          <CardDescription>审核和打款动作都在右侧完成，避免列表里堆叠大段说明。</CardDescription>
        </CardHeader>

        <CardContent>
          {detailLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
              正在加载提现详情...
            </div>
          ) : detailError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {detailError}
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">{detail.request_no}</h3>
                <Badge className={getSettlementStatusMeta(detail.status).className}>
                  {getSettlementStatusMeta(detail.status).label}
                </Badge>
                <Badge className={getSafetyStatusMeta(detail.safety_status).className}>
                  {getSafetyStatusMeta(detail.safety_status).label}
                </Badge>
              </div>

              {detail.safety_status === 'blocked' ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>当前提现申请已被拦截，不能直接审核通过。</p>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="推广员" value={detail.promoter_name || '-'} />
                <DetailField label="推广员邮箱" value={detail.promoter_email || '-'} />
                <DetailField label="申请金额" value={formatMoney(detail.requested_amount)} />
                <DetailField label="审核金额" value={formatMoney(detail.approved_amount)} />
                <DetailField label="已打款金额" value={formatMoney(detail.paid_amount)} />
                <DetailField label="提现方式" value={getSettlementMethodLabel(detail.method)} />
                <DetailField label="申请时间" value={formatDateTime(detail.applied_at)} />
                <DetailField label="可提现余额快照" value={formatMoney(detail.available_balance_snapshot)} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="脱敏收款账号" value={formatNullableText(detail.destination_account_masked)} />
                <DetailField label="原始收款账号" value={formatNullableText(detail.destination_account)} />
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                <p className="font-semibold">处理说明</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{formatNullableText(detail.process_note)}</p>
                {detail.reject_reason ? (
                  <p className="mt-3 text-sm text-destructive">驳回原因：{detail.reject_reason}</p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="审核人 UID" value={detail.reviewed_by_uid ?? '-'} />
                <DetailField label="审核时间" value={formatDateTime(detail.reviewed_at)} />
                <DetailField label="打款人 UID" value={detail.paid_by_uid ?? '-'} />
                <DetailField label="打款时间" value={formatDateTime(detail.paid_at)} />
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                <p className="font-semibold">打款凭证</p>
                {detail.proof_json?.proof_items?.length ? (
                  <div className="mt-3 space-y-2">
                    {detail.proof_json.proof_items.map((item, index) => (
                      <a
                        key={`${item.url}-${index}`}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block break-all text-sm text-primary hover:underline"
                      >
                        {item.name || item.url}
                      </a>
                    ))}
                    {detail.proof_json.operator_note ? (
                      <p className="text-sm text-muted-foreground">备注：{detail.proof_json.operator_note}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">当前还没有上传打款凭证。</p>
                )}
              </div>

              <div className="space-y-4 rounded-2xl border border-border/60 bg-background/50 p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="settlement-review-note">审核 / 处理备注</Label>
                    <span className="text-xs text-muted-foreground">
                      {reviewNote.length} / {NOTE_LIMIT}
                    </span>
                  </div>
                  <Textarea
                    id="settlement-review-note"
                    rows={4}
                    maxLength={NOTE_LIMIT}
                    value={reviewNote}
                    onChange={(event) => setReviewNote(event.target.value)}
                    placeholder="填写审核意见、人工复核说明或驳回原因"
                  />
                </div>

                {(detail.status === 'processing' || detail.proof_json) ? (
                  <div className="space-y-3">
                    <Label>打款凭证</Label>
                    <Input value={proofUrl} onChange={(event) => setProofUrl(event.target.value)} placeholder="凭证 URL" />
                    <Input value={proofName} onChange={(event) => setProofName(event.target.value)} placeholder="凭证文件名（可选）" />
                    <Textarea
                      rows={3}
                      value={proofOperatorNote}
                      onChange={(event) => setProofOperatorNote(event.target.value)}
                      placeholder="凭证备注（可选）"
                    />
                  </div>
                ) : null}

                {(detail.status === 'approved' || detail.status === 'processing') ? (
                  <div className="space-y-2">
                    <Label htmlFor="settlement-process-note">打款处理备注</Label>
                    <Textarea
                      id="settlement-process-note"
                      rows={3}
                      value={processNote}
                      onChange={(event) => setProcessNote(event.target.value)}
                      placeholder="填写财务处理说明"
                    />
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  {detail.status === 'submitted' ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => void handleReviewAction('approve')}
                        disabled={submitting || detail.safety_status === 'blocked'}
                      >
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        审核通过
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleReviewAction('manual_review')}
                        disabled={submitting || detail.safety_status === 'manual_review'}
                      >
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        标记人工复核
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleReviewAction('block')}
                        disabled={submitting || detail.safety_status === 'blocked'}
                      >
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        拦截
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => void handleReviewAction('reject')}
                        disabled={submitting}
                      >
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        驳回
                      </Button>
                    </>
                  ) : null}

                  {detail.status === 'approved' ? (
                    <>
                      <Button type="button" onClick={() => void handleStatusAction('mark_processing')} disabled={submitting}>
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        开始打款
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => void handleReviewAction('reject')}
                        disabled={submitting}
                      >
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        驳回
                      </Button>
                    </>
                  ) : null}

                  {detail.status === 'processing' ? (
                    <Button type="button" onClick={() => void handleStatusAction('mark_paid')} disabled={submitting}>
                      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      标记已打款
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-muted-foreground">
              请先从左侧列表选择一条提现申请。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

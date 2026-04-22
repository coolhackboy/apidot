'use client';

import { Loader2, RefreshCw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  DetailField,
  formatDateTime,
  formatMoney,
  formatNullableText,
  getCommissionStageMeta,
} from '@/components/admin/AffiliateManagement/helpers';
import { useAffiliateAdminCommissionOrders } from '@/components/admin/AffiliateManagement/useAffiliateAdminCommissionOrders';
import type { CommissionStageFilter } from '@/components/admin/AffiliateManagement/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

const stageOptions: Array<{ value: CommissionStageFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'hold', label: '冻结中' },
  { value: 'releasable', label: '可提现' },
  { value: 'locked', label: '提现处理中' },
  { value: 'risk_frozen', label: '风控冻结' },
  { value: 'paid', label: '已打款' },
  { value: 'reversed', label: '已冲销' },
];

const COMMISSION_REASON_LIMIT = 500;

type CommissionManualAction = 'unfreeze' | 'reverse';

const actionMeta: Record<
  CommissionManualAction,
  {
    buttonLabel: string;
    dialogTitle: string;
    dialogDescription: string;
    placeholder: string;
    successMessage: string;
  }
> = {
  unfreeze: {
    buttonLabel: '解除冻结',
    dialogTitle: '确认解除冻结',
    dialogDescription: '解除冻结后，系统会根据 hold_until 自动回到 pending_hold 或 available。',
    placeholder: '请输入解除冻结原因，例如：人工复核通过，解除冻结',
    successMessage: '佣金已解除冻结',
  },
  reverse: {
    buttonLabel: '冲销佣金',
    dialogTitle: '确认冲销佣金',
    dialogDescription: '冲销后佣金将变为 reversed，且当前关联提现单会被清空。',
    placeholder: '请输入冲销原因，例如：订单异常，人工冲销佣金',
    successMessage: '佣金已冲销',
  },
};

function getAvailableActions(dbStatus: string): CommissionManualAction[] {
  switch (dbStatus) {
    case 'risk_frozen':
      return ['unfreeze', 'reverse'];
    case 'pending_hold':
    case 'available':
      return ['reverse'];
    default:
      return [];
  }
}

export default function AffiliateCommissionOrdersTab({
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
    actionSubmitting,
    actionError,
    selectedCommissionId,
    stageFilter,
    keyword,
    setPage,
    setPageSize,
    setStageFilter,
    setKeyword,
    setSelectedCommissionId,
    refreshCurrentData,
    updateCommissionStatus,
    clearActionError,
  } = useAffiliateAdminCommissionOrders(onTotalChange, vendorCode);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<CommissionManualAction | null>(null);
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const availableActions = useMemo(
    () => (detail ? getAvailableActions(detail.db_status) : []),
    [detail]
  );
  const visibleError = validationError ?? actionError;
  const currentActionMeta = pendingAction ? actionMeta[pendingAction] : null;

  useEffect(() => {
    setDialogOpen(false);
    setPendingAction(null);
    setReason('');
    setValidationError(null);
  }, [selectedCommissionId]);

  const openActionDialog = (action: CommissionManualAction) => {
    clearActionError();
    setPendingAction(action);
    setReason('');
    setValidationError(null);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      clearActionError();
      setReason('');
      setPendingAction(null);
      setValidationError(null);
    }
  };

  const handleSubmitAction = async () => {
    if (!detail || !pendingAction) {
      return;
    }

    if (!reason.trim()) {
      setValidationError('处理原因不能为空');
      return;
    }

    if (reason.length > COMMISSION_REASON_LIMIT) {
      setValidationError('处理原因不能超过 500 字');
      return;
    }

    setValidationError(null);

    try {
      await updateCommissionStatus(detail.commission_id, {
        action: pendingAction,
        reason,
      });
      toast.success(actionMeta[pendingAction].successMessage);
      handleDialogOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '佣金处理失败');
    }
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="border border-border/60 bg-card/80">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">佣金订单</CardTitle>
              <CardDescription>列表只看状态与可释放时间，支付流水和处理原因放到详情。</CardDescription>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
              <div className="relative min-w-0 flex-1 xl:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索订单号 / 推广员 / 用户邮箱 / 邀请码"
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

          <div className="flex flex-wrap gap-2">
            {stageOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={stageFilter === option.value ? 'secondary' : 'ghost'}
                className={cn(
                  'rounded-full',
                  stageFilter === option.value && 'bg-primary/15 text-primary hover:bg-primary/20'
                )}
                onClick={() => setStageFilter(option.value)}
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
                  <TableHead>订单号</TableHead>
                  <TableHead>推广员</TableHead>
                  <TableHead>用户邮箱</TableHead>
                  <TableHead>订单金额</TableHead>
                  <TableHead>佣金金额</TableHead>
                  <TableHead>可释放时间</TableHead>
                  <TableHead className="text-right">状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-6 py-16 text-center text-sm text-muted-foreground">
                      <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
                      正在加载佣金订单...
                    </TableCell>
                  </TableRow>
                ) : items.length > 0 ? (
                  items.map((item) => {
                    const stageMeta = getCommissionStageMeta(item.stage);
                    const selected = selectedCommissionId === item.commission_id;

                    return (
                      <TableRow
                        key={item.commission_id}
                        className={cn('cursor-pointer hover:bg-muted/20', selected && 'bg-primary/5')}
                        onClick={() => setSelectedCommissionId(item.commission_id)}
                      >
                        <TableCell className="font-mono text-xs">{item.order_no ?? '-'}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{item.promoter_name || item.invite_code || '-'}</p>
                            <p className="text-xs text-muted-foreground">{item.promoter_email || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{item.invitee_email}</TableCell>
                        <TableCell>{formatMoney(item.payment_amount)}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatMoney(item.commission_amount)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(item.releasable_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={stageMeta.className}>{stageMeta.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="px-6 py-16 text-center text-sm text-muted-foreground">
                      当前筛选条件下没有佣金订单。
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
          <CardTitle className="text-xl">订单详情</CardTitle>
          <CardDescription>支付流水、处理说明和关联提现信息都放在详情区域。</CardDescription>
        </CardHeader>

        <CardContent>
          {detailLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
              正在加载订单详情...
            </div>
          ) : detailError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {detailError}
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">{detail.order_no ?? `佣金记录 #${detail.commission_id}`}</h3>
                <Badge className={getCommissionStageMeta(detail.stage).className}>
                  {getCommissionStageMeta(detail.stage).label}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="推广员" value={detail.promoter_name || '-'} />
                <DetailField label="推广员邮箱" value={detail.promoter_email || '-'} />
                <DetailField label="邀请码" value={detail.invite_code || '-'} />
                <DetailField label="被邀请用户邮箱" value={detail.invitee_email} />
                <DetailField label="订单金额" value={formatMoney(detail.payment_amount)} />
                <DetailField label="佣金金额" value={formatMoney(detail.commission_amount)} />
                <DetailField label="支付完成时间" value={formatDateTime(detail.payment_completed_at)} />
                <DetailField label="可释放时间" value={formatDateTime(detail.releasable_at)} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="支付流水号" value={formatNullableText(detail.transaction_id)} />
                <DetailField label="支付方式" value={detail.payment_method} />
                <DetailField label="状态原因" value={formatNullableText(detail.status_reason)} />
                <DetailField label="数据库原始状态" value={detail.db_status} />
                <DetailField label="邀请记录 ID" value={detail.invite_id} />
                <DetailField label="关联提现单 ID" value={detail.settlement_request_id ?? '-'} />
              </div>

              {availableActions.length > 0 ? (
                <div className="space-y-3 rounded-2xl border border-border/60 bg-background/50 p-4">
                  <div className="space-y-1">
                    <p className="font-semibold">人工处理</p>
                    <p className="text-sm text-muted-foreground">
                      当前状态以 db_status 为准，处理成功后会直接刷新详情和当前列表行。
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {availableActions.map((action) => (
                      <Button
                        key={action}
                        type="button"
                        variant={action === 'reverse' ? 'outline' : 'default'}
                        className={
                          action === 'reverse'
                            ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
                            : undefined
                        }
                        disabled={actionSubmitting}
                        onClick={() => openActionDialog(action)}
                      >
                        {actionSubmitting && pendingAction === action ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {actionMeta[action].buttonLabel}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-muted-foreground">
              请先从左侧列表选择一条佣金订单。
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentActionMeta?.dialogTitle ?? '确认处理佣金'}</DialogTitle>
            <DialogDescription>
              {currentActionMeta?.dialogDescription ?? '请填写本次处理原因后再提交。'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="commission-action-reason">处理原因</Label>
              <span className="text-xs text-muted-foreground">
                {reason.length} / {COMMISSION_REASON_LIMIT}
              </span>
            </div>
            <Textarea
              id="commission-action-reason"
              rows={4}
              maxLength={COMMISSION_REASON_LIMIT}
              value={reason}
              onChange={(event) => {
                clearActionError();
                setReason(event.target.value);
                if (validationError) {
                  setValidationError(null);
                }
              }}
              placeholder={currentActionMeta?.placeholder ?? '请输入处理原因'}
            />
            {visibleError ? <p className="text-sm text-destructive">{visibleError}</p> : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
              disabled={actionSubmitting}
            >
              取消
            </Button>
            <Button type="button" onClick={() => void handleSubmitAction()} disabled={actionSubmitting}>
              {actionSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {currentActionMeta?.buttonLabel ?? '确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

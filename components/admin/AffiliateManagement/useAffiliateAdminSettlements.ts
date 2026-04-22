'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { isNotFoundLikeError } from '@/components/admin/AffiliateManagement/helpers';
import type {
  AffiliateAdminSettlementDetail,
  AffiliateAdminSettlementListParams,
  AffiliateAdminSettlementItem,
  AffiliateAdminSettlementReviewPayload,
  AffiliateAdminSettlementStatusPayload,
} from '@/components/dashboard/affiliate/types';
import type {
  SettlementQueueFilter,
  SettlementQueuePreset,
} from '@/components/admin/AffiliateManagement/types';
import { affiliateService } from '@/services/affiliateService';

const DEFAULT_PAGE_SIZE = 20;

const SETTLEMENT_QUEUE_PRESETS: Record<SettlementQueueFilter, SettlementQueuePreset> = {
  all: { label: '全部' },
  submitted_pending: { label: '待审核', status: 'submitted', safety_status: 'pending' },
  submitted_manual_review: {
    label: '人工复核',
    status: 'submitted',
    safety_status: 'manual_review',
  },
  submitted_blocked: { label: '已拦截', status: 'submitted', safety_status: 'blocked' },
  approved: { label: '待打款', status: 'approved' },
  processing: { label: '打款中', status: 'processing' },
  paid: { label: '已打款', status: 'paid' },
  rejected: { label: '已驳回', status: 'rejected' },
};

export function useAffiliateAdminSettlements(
  onTotalChange?: (total: number) => void,
  vendorCode?: string
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [queueFilter, setQueueFilter] = useState<SettlementQueueFilter>('submitted_pending');
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  const [items, setItems] = useState<AffiliateAdminSettlementItem[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [listUnavailable, setListUnavailable] = useState(false);

  const [selectedSettlementId, setSelectedSettlementId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AffiliateAdminSettlementDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailUnavailable, setDetailUnavailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [keyword]);

  const queryParams = useMemo<AffiliateAdminSettlementListParams>(() => {
    const preset = SETTLEMENT_QUEUE_PRESETS[queueFilter];

    return {
      page,
      page_size: pageSize,
      status: preset.status,
      safety_status: preset.safety_status,
      vendor_code: vendorCode || undefined,
      keyword: debouncedKeyword || undefined,
    };
  }, [debouncedKeyword, page, pageSize, queueFilter, vendorCode]);

  const fetchList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    setListUnavailable(false);

    try {
      const response = await affiliateService.listAdminSettlements(queryParams);
      setItems(response.items);
      setTotal(response.total);
      onTotalChange?.(response.total);

      setSelectedSettlementId((current) => {
        if (current && response.items.some((item) => item.settlement_request_id === current)) {
          return current;
        }

        return response.items[0]?.settlement_request_id ?? null;
      });
    } catch (fetchError) {
      setItems([]);
      setTotal(0);
      setSelectedSettlementId(null);
      setDetail(null);

      if (isNotFoundLikeError(fetchError)) {
        setListUnavailable(true);
      } else {
        setListError(fetchError instanceof Error ? fetchError.message : '加载提现审核失败');
      }

      onTotalChange?.(0);
    } finally {
      setListLoading(false);
    }
  }, [onTotalChange, queryParams]);

  const fetchDetail = useCallback(async (settlementId: number | null) => {
    if (!settlementId) {
      setDetail(null);
      setDetailError(null);
      setDetailUnavailable(false);
      return;
    }

    setDetailLoading(true);
    setDetailError(null);
    setDetailUnavailable(false);

    try {
      const response = await affiliateService.getAdminSettlementDetail(settlementId);
      setDetail(response);
    } catch (fetchError) {
      setDetail(null);

      if (isNotFoundLikeError(fetchError)) {
        setDetailUnavailable(true);
      } else {
        setDetailError(fetchError instanceof Error ? fetchError.message : '加载提现详情失败');
      }
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    void fetchDetail(selectedSettlementId);
  }, [fetchDetail, selectedSettlementId]);

  const refreshCurrentData = useCallback(async () => {
    await fetchList();
    if (selectedSettlementId) {
      await fetchDetail(selectedSettlementId);
    }
  }, [fetchDetail, fetchList, selectedSettlementId]);

  const reviewSettlement = useCallback(
    async (payload: AffiliateAdminSettlementReviewPayload) => {
      if (!detail) {
        return null;
      }

      setSubmitting(true);

      try {
        const response = await affiliateService.reviewAdminSettlement(
          detail.settlement_request_id,
          payload
        );
        await fetchList();
        await fetchDetail(response.settlement_request_id);
        return response;
      } catch (submitError) {
        await refreshCurrentData().catch(() => undefined);
        throw submitError;
      } finally {
        setSubmitting(false);
      }
    },
    [detail, fetchDetail, fetchList, refreshCurrentData]
  );

  const updateSettlementStatus = useCallback(
    async (payload: AffiliateAdminSettlementStatusPayload) => {
      if (!detail) {
        return null;
      }

      setSubmitting(true);

      try {
        const response = await affiliateService.updateAdminSettlementStatus(
          detail.settlement_request_id,
          payload
        );
        await fetchList();
        await fetchDetail(response.settlement_request_id);
        return response;
      } catch (submitError) {
        await refreshCurrentData().catch(() => undefined);
        throw submitError;
      } finally {
        setSubmitting(false);
      }
    },
    [detail, fetchDetail, fetchList, refreshCurrentData]
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    page,
    pageSize,
    total,
    totalPages,
    items,
    listLoading,
    listError,
    listUnavailable,
    detail,
    detailLoading,
    detailError,
    detailUnavailable,
    submitting,
    selectedSettlementId,
    queueFilter,
    queueOptions: Object.entries(SETTLEMENT_QUEUE_PRESETS).map(([value, preset]) => ({
      value: value as SettlementQueueFilter,
      label: preset.label,
    })),
    keyword,
    setPage,
    setPageSize: (value: number) => {
      setPageSize(value);
      setPage(1);
    },
    setQueueFilter: (value: SettlementQueueFilter) => {
      setQueueFilter(value);
      setPage(1);
    },
    setKeyword: (value: string) => {
      setKeyword(value);
      setPage(1);
    },
    setSelectedSettlementId,
    refreshCurrentData,
    reviewSettlement,
    updateSettlementStatus,
  };
}

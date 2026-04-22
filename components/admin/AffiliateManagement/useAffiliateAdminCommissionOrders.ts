'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isNotFoundLikeError } from '@/components/admin/AffiliateManagement/helpers';
import type {
  AffiliateAdminCommissionOrderDetail,
  AffiliateAdminCommissionOrderListParams,
  AffiliateAdminCommissionOrderItem,
  AffiliateAdminCommissionStatusPayload,
} from '@/components/dashboard/affiliate/types';
import type { CommissionStageFilter } from '@/components/admin/AffiliateManagement/types';
import { affiliateService } from '@/services/affiliateService';

const DEFAULT_PAGE_SIZE = 20;

function matchesStageFilter(stage: AffiliateAdminCommissionOrderItem['stage'], stageFilter: CommissionStageFilter) {
  return stageFilter === 'all' || stage === stageFilter;
}

export function useAffiliateAdminCommissionOrders(
  onTotalChange?: (total: number) => void,
  vendorCode?: string
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [stageFilter, setStageFilter] = useState<CommissionStageFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  const [items, setItems] = useState<AffiliateAdminCommissionOrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [listUnavailable, setListUnavailable] = useState(false);

  const [selectedCommissionId, setSelectedCommissionId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AffiliateAdminCommissionOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailUnavailable, setDetailUnavailable] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const listRequestRef = useRef(0);
  const detailRequestRef = useRef(0);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [keyword]);

  const queryParams = useMemo<AffiliateAdminCommissionOrderListParams>(
    () => ({
      page,
      page_size: pageSize,
      stage: stageFilter === 'all' ? undefined : stageFilter,
      vendor_code: vendorCode || undefined,
      keyword: debouncedKeyword || undefined,
    }),
    [debouncedKeyword, page, pageSize, stageFilter, vendorCode]
  );

  const resetSelectionState = useCallback(() => {
    detailRequestRef.current += 1;
    setSelectedCommissionId(null);
    setDetail(null);
    setDetailLoading(false);
    setDetailError(null);
    setDetailUnavailable(false);
    setActionError(null);
  }, []);

  const fetchList = useCallback(async () => {
    const requestId = ++listRequestRef.current;
    setListLoading(true);
    setListError(null);
    setListUnavailable(false);
    setActionError(null);

    try {
      const response = await affiliateService.listAdminCommissionOrders(queryParams);
      if (listRequestRef.current !== requestId) {
        return;
      }
      setItems(response.items);
      setTotal(response.total);
      onTotalChange?.(response.total);

      setSelectedCommissionId((current) => {
        if (current && response.items.some((item) => item.commission_id === current)) {
          return current;
        }

        return response.items[0]?.commission_id ?? null;
      });
    } catch (fetchError) {
      if (listRequestRef.current !== requestId) {
        return;
      }
      setItems([]);
      setTotal(0);
      setSelectedCommissionId(null);
      setDetail(null);

      if (isNotFoundLikeError(fetchError)) {
        setListUnavailable(true);
      } else {
        setListError(fetchError instanceof Error ? fetchError.message : '加载佣金订单失败');
      }

      onTotalChange?.(0);
    } finally {
      if (listRequestRef.current === requestId) {
        setListLoading(false);
      }
    }
  }, [onTotalChange, queryParams]);

  const fetchDetail = useCallback(async (commissionId: number | null) => {
    if (!commissionId) {
      detailRequestRef.current += 1;
      setDetail(null);
      setDetailError(null);
      setDetailUnavailable(false);
      setActionError(null);
      return;
    }

    const requestId = ++detailRequestRef.current;
    setDetailLoading(true);
    setDetailError(null);
    setDetailUnavailable(false);
    setActionError(null);

    try {
      const response = await affiliateService.getAdminCommissionOrderDetail(commissionId);
      if (detailRequestRef.current !== requestId) {
        return;
      }
      setDetail(response);
    } catch (fetchError) {
      if (detailRequestRef.current !== requestId) {
        return;
      }
      setDetail(null);

      if (isNotFoundLikeError(fetchError)) {
        setDetailUnavailable(true);
      } else {
        setDetailError(fetchError instanceof Error ? fetchError.message : '加载佣金订单详情失败');
      }
    } finally {
      if (detailRequestRef.current === requestId) {
        setDetailLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    resetSelectionState();
  }, [queryParams, resetSelectionState]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    void fetchDetail(selectedCommissionId);
  }, [fetchDetail, selectedCommissionId]);

  useEffect(() => {
    setActionError(null);
  }, [selectedCommissionId]);

  const refreshCurrentData = useCallback(async () => {
    await fetchList();
    if (selectedCommissionId) {
      await fetchDetail(selectedCommissionId);
    }
  }, [fetchDetail, fetchList, selectedCommissionId]);

  const updateCommissionStatus = useCallback(
    async (commissionId: number, payload: AffiliateAdminCommissionStatusPayload) => {
      setActionSubmitting(true);
      setActionError(null);

      try {
        const updatedDetail = await affiliateService.updateAdminCommissionOrderStatus(commissionId, payload);
        const shouldKeepInList = matchesStageFilter(updatedDetail.stage, stageFilter);
        const shouldDecrementTotal =
          !shouldKeepInList && items.some((item) => item.commission_id === updatedDetail.commission_id);

        setDetail((current) =>
          current?.commission_id === updatedDetail.commission_id ? updatedDetail : current
        );
        setItems((current) => {
          if (!current.some((item) => item.commission_id === updatedDetail.commission_id)) {
            return current;
          }

          if (!shouldKeepInList) {
            return current.filter((item) => item.commission_id !== updatedDetail.commission_id);
          }

          return current.map((item) =>
            item.commission_id === updatedDetail.commission_id ? updatedDetail : item
          );
        });

        if (shouldDecrementTotal) {
          setTotal((current) => {
            const nextTotal = Math.max(0, current - 1);
            onTotalChange?.(nextTotal);
            return nextTotal;
          });
        }

        return updatedDetail;
      } catch (error) {
        const message = error instanceof Error ? error.message : '处理佣金订单失败';
        setActionError(message);
        throw error;
      } finally {
        setActionSubmitting(false);
      }
    },
    [items, onTotalChange, stageFilter]
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
    actionSubmitting,
    actionError,
    selectedCommissionId,
    stageFilter,
    keyword,
    setPage,
    setPageSize: (value: number) => {
      setPageSize(value);
      setPage(1);
    },
    setStageFilter: (value: CommissionStageFilter) => {
      setStageFilter(value);
      setPage(1);
    },
    setKeyword: (value: string) => {
      setKeyword(value);
      setPage(1);
    },
    setSelectedCommissionId,
    refreshCurrentData,
    updateCommissionStatus,
    clearActionError: () => setActionError(null),
  };
}

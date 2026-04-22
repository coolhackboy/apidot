'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { isNotFoundLikeError } from '@/components/admin/AffiliateManagement/helpers';
import type {
  AffiliateAdminApplicationListParams,
  AffiliateAdminReviewPayload,
  AffiliateApplication,
  AffiliateApplicationStatus,
  AffiliateStatus,
} from '@/components/dashboard/affiliate/types';
import { affiliateService } from '@/services/affiliateService';

const DEFAULT_PAGE_SIZE = 20;

export function useAffiliateAdminApplications(
  onTotalChange?: (total: number) => void,
  vendorCode?: string
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [applicationStatus, setApplicationStatus] = useState<'all' | AffiliateApplicationStatus>('all');
  const [affiliateStatus, setAffiliateStatus] = useState<'all' | AffiliateStatus>('all');
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  const [items, setItems] = useState<AffiliateApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [listUnavailable, setListUnavailable] = useState(false);

  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AffiliateApplication | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailUnavailable, setDetailUnavailable] = useState(false);

  const [reviewNote, setReviewNote] = useState('');
  const [manualRateBps, setManualRateBps] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [keyword]);

  const queryParams = useMemo<AffiliateAdminApplicationListParams>(
    () => ({
      page,
      page_size: pageSize,
      application_status: applicationStatus === 'all' ? undefined : applicationStatus,
      affiliate_status: affiliateStatus === 'all' ? undefined : affiliateStatus,
      vendor_code: vendorCode || undefined,
      keyword: debouncedKeyword || undefined,
    }),
    [affiliateStatus, applicationStatus, debouncedKeyword, page, pageSize, vendorCode]
  );

  const fetchList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    setListUnavailable(false);

    try {
      const response = await affiliateService.listAdminApplications(queryParams);
      setItems(response.items);
      setTotal(response.total);
      onTotalChange?.(response.total);

      setSelectedApplicationId((current) => {
        if (current && response.items.some((item) => item.id === current)) {
          return current;
        }

        return response.items[0]?.id ?? null;
      });
    } catch (error) {
      setItems([]);
      setTotal(0);
      setSelectedApplicationId(null);
      setDetail(null);

      if (isNotFoundLikeError(error)) {
        setListUnavailable(true);
      } else {
        setListError(error instanceof Error ? error.message : '加载申请列表失败');
      }

      onTotalChange?.(0);
    } finally {
      setListLoading(false);
    }
  }, [onTotalChange, queryParams]);

  const fetchDetail = useCallback(async (applicationId: number | null) => {
    if (!applicationId) {
      setDetail(null);
      setDetailError(null);
      setDetailUnavailable(false);
      setReviewNote('');
      setManualRateBps('');
      return;
    }

    setDetailLoading(true);
    setDetailError(null);
    setDetailUnavailable(false);

    try {
      const response = await affiliateService.getAdminApplicationDetail(applicationId);
      setDetail(response);
      setReviewNote(response.review_note ?? '');
      setManualRateBps(response.manual_rate_bps === null ? '' : String(response.manual_rate_bps));
    } catch (error) {
      setDetail(null);

      if (isNotFoundLikeError(error)) {
        setDetailUnavailable(true);
      } else {
        setDetailError(error instanceof Error ? error.message : '加载申请详情失败');
      }
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    void fetchDetail(selectedApplicationId);
  }, [fetchDetail, selectedApplicationId]);

  const refreshCurrentData = useCallback(async () => {
    await fetchList();
    if (selectedApplicationId) {
      await fetchDetail(selectedApplicationId);
    }
  }, [fetchDetail, fetchList, selectedApplicationId]);

  const reviewApplication = useCallback(
    async (action: 'approve' | 'reject') => {
      if (!detail) {
        return null;
      }

      const payload: AffiliateAdminReviewPayload = {
        action,
      };

      const trimmedReviewNote = reviewNote.trim();
      if (trimmedReviewNote) {
        payload.review_note = trimmedReviewNote;
      }

      if (action === 'approve' && manualRateBps.trim()) {
        payload.manual_rate_bps = Number(manualRateBps);
      }

      setReviewSubmitting(true);

      try {
        const response = await affiliateService.reviewAdminApplication(detail.id, payload);
        await fetchList();
        await fetchDetail(response.id);
        return response;
      } catch (error) {
        await refreshCurrentData().catch(() => undefined);
        throw error;
      } finally {
        setReviewSubmitting(false);
      }
    },
    [detail, fetchDetail, fetchList, manualRateBps, refreshCurrentData, reviewNote]
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasReviewed =
    detail?.application_status === 'approved' || detail?.application_status === 'rejected';

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
    selectedApplicationId,
    applicationStatus,
    affiliateStatus,
    keyword,
    reviewNote,
    manualRateBps,
    reviewSubmitting,
    hasReviewed,
    setPage,
    setPageSize: (value: number) => {
      setPageSize(value);
      setPage(1);
    },
    setApplicationStatus: (value: 'all' | AffiliateApplicationStatus) => {
      setApplicationStatus(value);
      setPage(1);
    },
    setAffiliateStatus: (value: 'all' | AffiliateStatus) => {
      setAffiliateStatus(value);
      setPage(1);
    },
    setKeyword: (value: string) => {
      setKeyword(value);
      setPage(1);
    },
    setSelectedApplicationId,
    setReviewNote,
    setManualRateBps,
    refreshCurrentData,
    reviewApplication,
  };
}

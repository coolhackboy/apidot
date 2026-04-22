'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isNotFoundLikeError } from '@/components/admin/AffiliateManagement/helpers';
import type {
  AffiliateAdminPartnerDetail,
  AffiliateAdminPartnerItem,
  AffiliateAdminPartnerListParams,
  AffiliateAdminPartnerStatusPayload,
  AffiliateAdminPartnerWatchlistPayload,
} from '@/components/dashboard/affiliate/types';
import type {
  PartnerPrimaryStatusFilter,
  PartnerStatusTagFilter,
} from '@/components/admin/AffiliateManagement/types';
import { affiliateService } from '@/services/affiliateService';

const DEFAULT_PAGE_SIZE = 20;

function matchesPrimaryStatusFilter(
  primaryStatus: AffiliateAdminPartnerItem['primary_status'],
  filter: PartnerPrimaryStatusFilter
) {
  return filter === 'all' || primaryStatus === filter;
}

function matchesStatusTagFilter(
  statusTags: AffiliateAdminPartnerItem['status_tags'],
  filter: PartnerStatusTagFilter
) {
  return filter === 'all' || statusTags.includes(filter);
}

function matchesPartnerFilters(
  partner: Pick<AffiliateAdminPartnerItem, 'primary_status' | 'status_tags'>,
  primaryStatusFilter: PartnerPrimaryStatusFilter,
  statusTagFilter: PartnerStatusTagFilter
) {
  return (
    matchesPrimaryStatusFilter(partner.primary_status, primaryStatusFilter) &&
    matchesStatusTagFilter(partner.status_tags, statusTagFilter)
  );
}

function toPartnerListItem(detail: AffiliateAdminPartnerDetail): AffiliateAdminPartnerItem {
  return {
    promoter_user_id: detail.promoter_user_id,
    promoter_name: detail.promoter_name,
    promoter_email: detail.promoter_email,
    invite_code: detail.invite_code,
    invite_count: detail.invite_count,
    total_commission: detail.total_commission,
    primary_status: detail.primary_status,
    status_tags: detail.status_tags,
  };
}

export function useAffiliateAdminPartners(
  onTotalChange?: (total: number) => void,
  vendorCode?: string
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [primaryStatusFilter, setPrimaryStatusFilter] =
    useState<PartnerPrimaryStatusFilter>('all');
  const [statusTagFilter, setStatusTagFilter] = useState<PartnerStatusTagFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  const [items, setItems] = useState<AffiliateAdminPartnerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [listUnavailable, setListUnavailable] = useState(false);

  const [selectedPromoterId, setSelectedPromoterId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AffiliateAdminPartnerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailUnavailable, setDetailUnavailable] = useState(false);
  const [detailOutsideFilters, setDetailOutsideFilters] = useState(false);
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

  const queryParams = useMemo<AffiliateAdminPartnerListParams>(
    () => ({
      page,
      page_size: pageSize,
      primary_status: primaryStatusFilter === 'all' ? undefined : primaryStatusFilter,
      status_tag: statusTagFilter === 'all' ? undefined : statusTagFilter,
      vendor_code: vendorCode || undefined,
      keyword: debouncedKeyword || undefined,
    }),
    [debouncedKeyword, page, pageSize, primaryStatusFilter, statusTagFilter, vendorCode]
  );

  const resetSelectionState = useCallback(() => {
    detailRequestRef.current += 1;
    setSelectedPromoterId(null);
    setDetail(null);
    setDetailLoading(false);
    setDetailError(null);
    setDetailUnavailable(false);
    setDetailOutsideFilters(false);
    setActionError(null);
  }, []);

  const fetchList = useCallback(async () => {
    const requestId = ++listRequestRef.current;
    setListLoading(true);
    setListError(null);
    setListUnavailable(false);
    setDetailOutsideFilters(false);
    setActionError(null);

    try {
      const response = await affiliateService.listAdminPartners(queryParams);
      if (listRequestRef.current !== requestId) {
        return;
      }
      setItems(response.items);
      setTotal(response.total);
      onTotalChange?.(response.total);

      setSelectedPromoterId((current) => {
        if (current && response.items.some((item) => item.promoter_user_id === current)) {
          return current;
        }

        return response.items[0]?.promoter_user_id ?? null;
      });
    } catch (fetchError) {
      if (listRequestRef.current !== requestId) {
        return;
      }

      setItems([]);
      setTotal(0);
      setSelectedPromoterId(null);
      setDetail(null);

      if (isNotFoundLikeError(fetchError)) {
        setListUnavailable(true);
      } else {
        setListError(fetchError instanceof Error ? fetchError.message : '加载推广员列表失败');
      }

      onTotalChange?.(0);
    } finally {
      if (listRequestRef.current === requestId) {
        setListLoading(false);
      }
    }
  }, [onTotalChange, queryParams]);

  const fetchDetail = useCallback(async (promoterId: number | null) => {
    if (!promoterId) {
      detailRequestRef.current += 1;
      setDetail(null);
      setDetailError(null);
      setDetailUnavailable(false);
      setDetailOutsideFilters(false);
      setActionError(null);
      return;
    }

    const requestId = ++detailRequestRef.current;
    setDetailLoading(true);
    setDetailError(null);
    setDetailUnavailable(false);
    setDetailOutsideFilters(false);
    setActionError(null);

    try {
      const response = await affiliateService.getAdminPartnerDetail(promoterId, {
        vendor_code: vendorCode || undefined,
      });
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
        setDetailError(fetchError instanceof Error ? fetchError.message : '加载推广员详情失败');
      }
    } finally {
      if (detailRequestRef.current === requestId) {
        setDetailLoading(false);
      }
    }
  }, [vendorCode]);

  useEffect(() => {
    resetSelectionState();
  }, [queryParams, resetSelectionState]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    void fetchDetail(selectedPromoterId);
  }, [fetchDetail, selectedPromoterId]);

  useEffect(() => {
    setDetailOutsideFilters(false);
    setActionError(null);
  }, [selectedPromoterId]);

  const refreshCurrentData = useCallback(async () => {
    await fetchList();
    if (selectedPromoterId) {
      await fetchDetail(selectedPromoterId);
    }
  }, [fetchDetail, fetchList, selectedPromoterId]);

  const applyUpdatedPartner = useCallback(
    (updatedDetail: AffiliateAdminPartnerDetail) => {
      const nextListItem = toPartnerListItem(updatedDetail);
      const shouldMatchFilters = matchesPartnerFilters(
        nextListItem,
        primaryStatusFilter,
        statusTagFilter
      );
      const existedInList = items.some(
        (item) => item.promoter_user_id === updatedDetail.promoter_user_id
      );

      setDetail(updatedDetail);
      setDetailOutsideFilters(!shouldMatchFilters);
      setItems((current) => {
        const rowExists = current.some(
          (item) => item.promoter_user_id === updatedDetail.promoter_user_id
        );

        if (!shouldMatchFilters) {
          return current.filter(
            (item) => item.promoter_user_id !== updatedDetail.promoter_user_id
          );
        }

        if (rowExists) {
          return current.map((item) =>
            item.promoter_user_id === updatedDetail.promoter_user_id ? nextListItem : item
          );
        }

        if (detailOutsideFilters) {
          return [nextListItem, ...current].slice(0, pageSize);
        }

        return current;
      });

      if (!shouldMatchFilters && existedInList) {
        setTotal((current) => {
          const nextTotal = Math.max(0, current - 1);
          onTotalChange?.(nextTotal);
          return nextTotal;
        });
      } else if (shouldMatchFilters && !existedInList && detailOutsideFilters) {
        setTotal((current) => {
          const nextTotal = current + 1;
          onTotalChange?.(nextTotal);
          return nextTotal;
        });
      }

      return updatedDetail;
    },
    [detailOutsideFilters, items, onTotalChange, pageSize, primaryStatusFilter, statusTagFilter]
  );

  const updatePartnerStatus = useCallback(
    async (userId: number, payload: AffiliateAdminPartnerStatusPayload) => {
      setActionSubmitting(true);
      setActionError(null);

      try {
        const updatedDetail = await affiliateService.updateAdminPartnerStatus(userId, payload);
        return applyUpdatedPartner(updatedDetail);
      } catch (error) {
        const message = error instanceof Error ? error.message : '更新推广员状态失败';
        setActionError(message);
        throw error;
      } finally {
        setActionSubmitting(false);
      }
    },
    [applyUpdatedPartner]
  );

  const updatePartnerWatchlist = useCallback(
    async (userId: number, payload: AffiliateAdminPartnerWatchlistPayload) => {
      setActionSubmitting(true);
      setActionError(null);

      try {
        const updatedDetail = await affiliateService.updateAdminPartnerWatchlist(userId, payload);
        return applyUpdatedPartner(updatedDetail);
      } catch (error) {
        const message = error instanceof Error ? error.message : '更新观察名单状态失败';
        setActionError(message);
        throw error;
      } finally {
        setActionSubmitting(false);
      }
    },
    [applyUpdatedPartner]
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
    detailOutsideFilters,
    actionSubmitting,
    actionError,
    selectedPromoterId,
    primaryStatusFilter,
    statusTagFilter,
    keyword,
    setPage,
    setPageSize: (value: number) => {
      setPageSize(value);
      setPage(1);
    },
    setPrimaryStatusFilter: (value: PartnerPrimaryStatusFilter) => {
      setPrimaryStatusFilter(value);
      setPage(1);
    },
    setStatusTagFilter: (value: PartnerStatusTagFilter) => {
      setStatusTagFilter(value);
      setPage(1);
    },
    setKeyword: (value: string) => {
      setKeyword(value);
      setPage(1);
    },
    setSelectedPromoterId,
    refreshCurrentData,
    updatePartnerStatus,
    updatePartnerWatchlist,
    clearActionError: () => setActionError(null),
  };
}

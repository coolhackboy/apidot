'use client';

import { useCallback, useEffect, useState } from 'react';

import { isNotFoundLikeError } from '@/components/admin/AffiliateManagement/helpers';
import type { AffiliateAdminOverview } from '@/components/dashboard/affiliate/types';
import { affiliateService } from '@/services/affiliateService';

export function useAffiliateAdminOverview(vendorCode?: string) {
  const [overview, setOverview] = useState<AffiliateAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnavailable(false);

    try {
      const response = await affiliateService.getAdminOverview({
        vendor_code: vendorCode || undefined,
      });
      setOverview(response);
    } catch (fetchError) {
      setOverview(null);
      if (isNotFoundLikeError(fetchError)) {
        setUnavailable(true);
        setError(null);
      } else {
        setError(fetchError instanceof Error ? fetchError.message : '加载推广总览失败');
      }
    } finally {
      setLoading(false);
    }
  }, [vendorCode]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    overview,
    loading,
    error,
    unavailable,
    refresh,
  };
}

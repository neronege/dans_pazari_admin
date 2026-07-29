'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { getDashboardSummary } from 'modules/dashboard/api/dashboard.service';

const summaryKey = 'admin/dashboard/summary';

export default function useDashboardSummary() {
  const { data, error, isLoading, mutate } = useSWR(summaryKey, getDashboardSummary, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });

  const summary = useMemo(() => {
    if (!data || typeof data !== 'object') {
      return null;
    }

    return {
      totalSalesAmount: Number(data.totalSalesAmount || 0),
      currency: data.currency || 'TRY',
      paidOrderCount: Number(data.paidOrderCount || 0),
      activeEventCount: Number(data.activeEventCount || 0),
      pendingRefundCount: Number(data.pendingRefundCount || 0),
      generatedAtUtc: data.generatedAtUtc || null
    };
  }, [data]);

  return {
    summary,
    isLoading,
    error,
    retry: mutate
  };
}

'use client';

import useSWR from 'swr';
import { getPerformanceReport, getSalesReport } from 'modules/reports/api';

const EMPTY_PERFORMANCE_ROWS = [];

export default function useReports(filters = {}) {
  const fromUtc = filters.fromUtc || '';
  const toUtc = filters.toUtc || '';

  const salesKey = ['admin/reports/sales/module', fromUtc, toUtc];
  const performanceKey = ['admin/reports/performance/module', fromUtc, toUtc];

  const {
    data: salesData,
    error: salesError,
    isLoading: salesLoading,
    mutate: refreshSales
  } = useSWR(
    salesKey,
    ([, currentFromUtc, currentToUtc]) =>
      getSalesReport({
        fromUtc: currentFromUtc || undefined,
        toUtc: currentToUtc || undefined
      }),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  const {
    data: performanceData,
    error: performanceError,
    isLoading: performanceLoading,
    mutate: refreshPerformance
  } = useSWR(
    performanceKey,
    ([, currentFromUtc, currentToUtc]) =>
      getPerformanceReport({
        fromUtc: currentFromUtc || undefined,
        toUtc: currentToUtc || undefined
      }),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  return {
    sales: salesData || null,
    performanceRows: Array.isArray(performanceData) ? performanceData : performanceData?.items || EMPTY_PERFORMANCE_ROWS,
    isLoading: salesLoading || performanceLoading,
    salesError,
    performanceError,
    refresh: async () => {
      await Promise.all([refreshSales(), refreshPerformance()]);
    }
  };
}

'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { getPerformanceReport } from 'modules/reports/api';

const EMPTY_PERFORMANCE_ROWS = [];

function getDefaultRange() {
  const now = new Date();
  const toUtc = now.toISOString();
  const fromUtcDate = new Date(now);
  fromUtcDate.setDate(fromUtcDate.getDate() - 29);

  return {
    fromUtc: fromUtcDate.toISOString(),
    toUtc
  };
}

export default function useDashboardPerformanceReport() {
  const range = useMemo(() => getDefaultRange(), []);

  const { data, error, isLoading, mutate } = useSWR(
    ['admin/reports/performance', range.fromUtc, range.toUtc],
    ([, fromUtc, toUtc]) => getPerformanceReport({ fromUtc, toUtc }),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  return {
    performanceRows: Array.isArray(data) ? data : data?.items || EMPTY_PERFORMANCE_ROWS,
    isLoading,
    error,
    retry: mutate
  };
}

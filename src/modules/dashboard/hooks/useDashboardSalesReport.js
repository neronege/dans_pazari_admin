'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { getSalesReport } from 'modules/reports/api';

function toIsoDate(value) {
  return value.toISOString();
}

function rangeFromPeriod(period) {
  const now = new Date();
  const toUtc = new Date(now);
  const fromUtc = new Date(now);

  switch (period) {
    case 'week':
      fromUtc.setDate(fromUtc.getDate() - 6);
      break;
    case 'year':
      fromUtc.setDate(fromUtc.getDate() - 364);
      break;
    case 'month':
    default:
      fromUtc.setDate(fromUtc.getDate() - 29);
      break;
  }

  return {
    fromUtc: toIsoDate(fromUtc),
    toUtc: toIsoDate(toUtc)
  };
}

export default function useDashboardSalesReport(period = 'month') {
  const range = useMemo(() => rangeFromPeriod(period), [period]);

  const { data, error, isLoading, mutate } = useSWR(
    ['admin/reports/sales', period, range.fromUtc, range.toUtc],
    ([, , fromUtc, toUtc]) => getSalesReport({ fromUtc, toUtc }),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  return {
    sales: data || null,
    isLoading,
    error,
    retry: mutate
  };
}

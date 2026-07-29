'use client';

import useSWR from 'swr';
import { getRefundRequests } from 'modules/refunds/api/refunds.service';

const EMPTY_REFUNDS = [];

export default function useRefunds(filters = {}) {
  const status = filters.status || '';
  const take = Number(filters.take || 50);

  const key = ['admin/refunds', status, take];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([, currentStatus, currentTake]) =>
      getRefundRequests({
        status: currentStatus || undefined,
        take: currentTake
      }),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  return {
    refunds: data?.items || EMPTY_REFUNDS,
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    refresh: mutate
  };
}

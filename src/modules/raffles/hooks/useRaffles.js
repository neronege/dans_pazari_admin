'use client';

import useSWR from 'swr';
import { getRaffles } from 'modules/raffles/api/raffles.service';

const EMPTY_RAFFLES = [];

export default function useRaffles(filters = {}) {
  const page = Number(filters.page || 1);
  const pageSize = Number(filters.pageSize || 20);
  const search = filters.search || '';
  const status = filters.status || '';

  const key = ['admin/raffles', page, pageSize, search, status];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([, currentPage, currentPageSize, currentSearch, currentStatus]) =>
      getRaffles({
        page: currentPage,
        pageSize: currentPageSize,
        search: currentSearch || undefined,
        status: currentStatus || undefined
      }),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  return {
    raffles: data?.items || EMPTY_RAFFLES,
    page: data?.page || page,
    pageSize: data?.pageSize || pageSize,
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    refresh: mutate
  };
}

'use client';

import useSWR from 'swr';
import { getOrders } from 'modules/orders/api/orders.service';

const EMPTY_ORDERS = [];

export default function useOrders(filters = {}) {
  const page = Number(filters.page || 1);
  const pageSize = Number(filters.pageSize || 20);
  const search = filters.search || '';
  const status = filters.status || '';

  const key = ['admin/orders', page, pageSize, search, status];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([, currentPage, currentPageSize, currentSearch, currentStatus]) =>
      getOrders({
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
    orders: data?.items || EMPTY_ORDERS,
    page: data?.page || page,
    pageSize: data?.pageSize || pageSize,
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    refresh: mutate
  };
}

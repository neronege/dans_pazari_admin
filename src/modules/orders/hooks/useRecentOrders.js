'use client';

import useSWR from 'swr';
import { getOrders } from 'modules/orders/api/orders.service';

const recentOrdersKey = 'admin/orders/recent';
const EMPTY_ORDERS = [];

async function fetchRecentOrders() {
  return getOrders({ page: 1, pageSize: 10 });
}

export default function useRecentOrders() {
  const { data, error, isLoading, mutate } = useSWR(recentOrdersKey, fetchRecentOrders, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });

  return {
    orders: data?.items || EMPTY_ORDERS,
    isLoading,
    error,
    retry: mutate
  };
}

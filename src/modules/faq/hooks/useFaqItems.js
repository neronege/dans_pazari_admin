'use client';

import useSWR from 'swr';
import { getFaqItems } from 'modules/faq/api/faq.service';

export default function useFaqItems() {
  const { data, error, isLoading, mutate } = useSWR('admin/faq', getFaqItems, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });

  return {
    items: Array.isArray(data) ? data : [],
    isLoading,
    error,
    refresh: () => mutate()
  };
}

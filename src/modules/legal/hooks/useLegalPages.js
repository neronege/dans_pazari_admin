'use client';

import useSWR from 'swr';
import { getLegalPages } from 'modules/legal/api/legal.service';

export default function useLegalPages() {
  const { data, error, isLoading, mutate } = useSWR('admin/legal', getLegalPages, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });

  return {
    pages: Array.isArray(data) ? data : [],
    isLoading,
    error,
    refresh: () => mutate()
  };
}

'use client';

import useSWR from 'swr';
import { getBlogCategories } from 'modules/blog/api/blog.service';

export default function useBlogCategories() {
  const { data, error, isLoading, mutate } = useSWR('admin/blog/categories', getBlogCategories, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });

  return {
    categories: Array.isArray(data) ? data : [],
    isLoading,
    error,
    refresh: () => mutate()
  };
}

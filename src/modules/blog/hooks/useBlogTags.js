'use client';

import useSWR from 'swr';
import { getBlogTags } from 'modules/blog/api/blog.service';

export default function useBlogTags() {
  const { data, error, isLoading, mutate } = useSWR('admin/blog/tags', getBlogTags, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });

  return {
    tags: Array.isArray(data) ? data : [],
    isLoading,
    error,
    refresh: () => mutate()
  };
}

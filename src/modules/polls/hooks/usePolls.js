'use client';

import useSWR from 'swr';
import { getPolls } from 'modules/polls/api/polls.service';

export default function usePolls() {
  const { data, error, isLoading, mutate } = useSWR('admin/polls', getPolls, {
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

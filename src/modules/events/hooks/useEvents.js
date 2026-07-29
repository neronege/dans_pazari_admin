'use client';

import useSWR from 'swr';
import { getEvents } from 'modules/events/api/events.service';

const EMPTY_EVENTS = [];

export default function useEvents(filters = {}) {
  const key = ['admin/events', filters.categoryId || '', filters.city || '', filters.search || '', filters.status || ''];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([, categoryId, city, search, status]) =>
      getEvents({
        categoryId: categoryId || undefined,
        city: city || undefined,
        search: search || undefined,
        status: status || undefined
      }),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  return {
    events: data || EMPTY_EVENTS,
    isLoading,
    error,
    refresh: mutate
  };
}

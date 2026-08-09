'use client';

import useSWR from 'swr';
import { getGateEvents } from 'modules/tickets/api/tickets.service';

const EMPTY_EVENTS = [];

export default function useGateEvents(filters = {}) {
  const key = ['admin/gate/events', filters.search || '', filters.status || ''];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([, search, status]) =>
      getGateEvents({
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

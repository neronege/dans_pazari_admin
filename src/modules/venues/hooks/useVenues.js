'use client';

import useSWR from 'swr';
import { getVenues } from 'modules/venues/api/venues.service';

const EMPTY_VENUES = [];

export default function useVenues(filters = {}) {
  const key = ['admin/venues', filters.city || '', filters.search || ''];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([, city, search]) =>
      getVenues({
        city: city || undefined,
        search: search || undefined
      }),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  return {
    venues: data || EMPTY_VENUES,
    isLoading,
    error,
    refresh: mutate
  };
}

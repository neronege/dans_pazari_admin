'use client';

import useSWR from 'swr';
import { getPartners } from 'modules/partners/api/partners.service';

const EMPTY = [];

export default function usePartners({ kind, search = '' } = {}) {
  const key = ['admin/partners', kind, search || ''];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([, partnerKind, nextSearch]) =>
      getPartners({
        kind: partnerKind,
        search: nextSearch || undefined
      }),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  return {
    items: data || EMPTY,
    isLoading,
    error,
    refresh: mutate
  };
}

'use client';

import useSWR from 'swr';
import { getInboundEmails } from 'modules/support/api/support.service';

const EMPTY = [];

export default function useSupportInbox(filters = {}) {
  const take = Number(filters.take || 50);
  const unreadOnly = filters.unreadOnly === true;
  const key = ['admin/support/inbound', take, unreadOnly];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([, currentTake, currentUnreadOnly]) =>
      getInboundEmails({
        take: currentTake,
        unreadOnly: currentUnreadOnly
      }),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  return {
    emails: data?.items || EMPTY,
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    refresh: mutate
  };
}

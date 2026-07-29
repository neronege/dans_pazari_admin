'use client';

import useSWR from 'swr';
import { getUsers } from 'modules/users/api/users.service';

const EMPTY_USERS = [];

export default function useUsers(filters = {}) {
  const page = Number(filters.page || 1);
  const pageSize = Number(filters.pageSize || 20);
  const search = filters.search || '';
  const status = filters.status || '';
  const isGuest = filters.isGuest || '';

  const key = ['admin/users', page, pageSize, search, status, isGuest];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([, currentPage, currentPageSize, currentSearch, currentStatus, currentIsGuest]) =>
      getUsers({
        page: currentPage,
        pageSize: currentPageSize,
        search: currentSearch || undefined,
        status: currentStatus || undefined,
        isGuest: currentIsGuest === '' ? undefined : currentIsGuest === 'true'
      }),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  return {
    users: data?.items || EMPTY_USERS,
    page: data?.page || page,
    pageSize: data?.pageSize || pageSize,
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    refresh: mutate
  };
}

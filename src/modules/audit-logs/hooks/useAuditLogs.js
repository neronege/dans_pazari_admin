'use client';

import useSWR from 'swr';
import { getAuditLogs } from 'modules/audit-logs/api/auditLogs.service';

const EMPTY_LOGS = [];

export default function useAuditLogs(filters = {}) {
  const page = Number(filters.page || 1);
  const pageSize = Number(filters.pageSize || 20);
  const search = filters.search || '';
  const action = filters.action || '';
  const entityType = filters.entityType || '';
  const fromUtc = filters.fromUtc || '';
  const toUtc = filters.toUtc || '';

  const key = ['admin/audit-logs', page, pageSize, search, action, entityType, fromUtc, toUtc];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([, currentPage, currentPageSize, currentSearch, currentAction, currentEntityType, currentFromUtc, currentToUtc]) =>
      getAuditLogs({
        page: currentPage,
        pageSize: currentPageSize,
        search: currentSearch || undefined,
        action: currentAction || undefined,
        entityType: currentEntityType || undefined,
        fromUtc: currentFromUtc || undefined,
        toUtc: currentToUtc || undefined
      }),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  return {
    logs: data?.items || EMPTY_LOGS,
    page: data?.page || page,
    pageSize: data?.pageSize || pageSize,
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    refresh: mutate
  };
}

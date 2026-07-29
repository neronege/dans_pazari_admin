import { buildPageQuery, endpoints, httpClient, normalizePagedResponse } from 'shared/api';

function normalizeAuditResponse(payload, paging) {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      page: paging.page,
      pageSize: paging.pageSize,
      totalCount: payload.length
    };
  }

  return normalizePagedResponse(payload, paging);
}

export async function getAuditLogs(params = {}) {
  const paging = buildPageQuery({
    page: params.page,
    pageSize: params.pageSize
  });

  const response = await httpClient.get(endpoints.admin.auditLogs.list, {
    params: {
      ...paging,
      search: params.search,
      action: params.action,
      entityType: params.entityType,
      fromUtc: params.fromUtc,
      toUtc: params.toUtc
    }
  });

  return normalizeAuditResponse(response.data, paging);
}

export async function getAuditLogDetail(auditLogId) {
  const response = await httpClient.get(endpoints.admin.auditLogs.detail(auditLogId));
  return response.data;
}

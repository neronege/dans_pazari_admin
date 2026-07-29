import { endpoints, httpClient } from 'shared/api';

function normalizeRefundList(payload) {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      totalCount: payload.length
    };
  }

  const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.refundRequests) ? payload.refundRequests : [];

  return {
    items,
    totalCount: Number.isFinite(Number(payload?.totalCount)) ? Number(payload.totalCount) : items.length
  };
}

export async function getRefundRequests(params = {}) {
  const response = await httpClient.get(endpoints.admin.refunds.list, {
    params: {
      status: params.status || undefined,
      take: params.take || undefined
    }
  });

  return normalizeRefundList(response.data);
}

export async function getRefundRequestDetail(refundRequestId) {
  const response = await httpClient.get(endpoints.admin.refunds.detail(refundRequestId));
  return response.data;
}

export async function approveRefundRequest(refundRequestId, payload) {
  const response = await httpClient.post(endpoints.admin.refunds.approve(refundRequestId), payload);
  return response.data;
}

export async function rejectRefundRequest(refundRequestId, payload) {
  const response = await httpClient.post(endpoints.admin.refunds.reject(refundRequestId), payload);
  return response.data;
}

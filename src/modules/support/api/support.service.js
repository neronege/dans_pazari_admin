import { endpoints, httpClient } from 'shared/api';

export async function getInboundEmails(params = {}) {
  const response = await httpClient.get(endpoints.admin.support.inboundEmails, {
    params: {
      take: params.take || 50,
      unreadOnly: params.unreadOnly === true ? true : undefined
    }
  });

  const data = response.data;
  const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  return {
    items,
    totalCount: Number.isFinite(Number(data?.totalCount)) ? Number(data.totalCount) : items.length
  };
}

export async function getInboundEmailDetail(id) {
  const response = await httpClient.get(endpoints.admin.support.inboundEmailDetail(id));
  return response.data;
}

export async function markInboundEmailRead(id) {
  const response = await httpClient.post(endpoints.admin.support.markRead(id));
  return response.data;
}

export async function replyInboundEmail(id, body) {
  const response = await httpClient.post(endpoints.admin.support.reply(id), { body });
  return response.data;
}

import { endpoints, httpClient } from 'shared/api';

function normalizeList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

export async function getFaqItems() {
  const response = await httpClient.get(endpoints.admin.faq.list);
  return normalizeList(response.data);
}

export async function getFaqItemDetail(id) {
  const response = await httpClient.get(endpoints.admin.faq.detail(id));
  return response.data;
}

export async function createFaqItem(payload) {
  const response = await httpClient.post(endpoints.admin.faq.list, payload);
  return response.data;
}

export async function updateFaqItem(id, payload) {
  const response = await httpClient.put(endpoints.admin.faq.detail(id), payload);
  return response.data;
}

export async function deleteFaqItem(id) {
  await httpClient.delete(endpoints.admin.faq.detail(id));
}

export async function publishFaqItem(id) {
  const response = await httpClient.patch(endpoints.admin.faq.publish(id), {});
  return response.data;
}

export async function unpublishFaqItem(id) {
  const response = await httpClient.patch(endpoints.admin.faq.unpublish(id), {});
  return response.data;
}

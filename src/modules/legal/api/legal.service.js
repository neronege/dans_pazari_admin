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

export async function getLegalPages() {
  const response = await httpClient.get(endpoints.admin.legal.list);
  return normalizeList(response.data);
}

export async function getLegalPageDetail(slug) {
  const response = await httpClient.get(endpoints.admin.legal.detail(slug));
  return response.data;
}

export async function createLegalPage(payload) {
  const response = await httpClient.post(endpoints.admin.legal.list, payload);
  return response.data;
}

export async function upsertLegalPage(slug, payload) {
  const response = await httpClient.put(endpoints.admin.legal.detail(slug), payload);
  return response.data;
}

export async function deleteLegalPage(slug) {
  await httpClient.delete(endpoints.admin.legal.detail(slug));
}

export async function publishLegalPage(slug) {
  const response = await httpClient.patch(endpoints.admin.legal.publish(slug), {});
  return response.data;
}

export async function unpublishLegalPage(slug) {
  const response = await httpClient.patch(endpoints.admin.legal.unpublish(slug), {});
  return response.data;
}

import { endpoints, httpClient } from 'shared/api';

function normalizeListPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.categories)) {
    return payload.categories;
  }

  return [];
}

export async function getCategories() {
  const response = await httpClient.get(endpoints.admin.categories.list);
  return normalizeListPayload(response.data);
}

export async function getCategoryDetail(categoryId) {
  const response = await httpClient.get(endpoints.admin.categories.detail(categoryId));
  return response.data;
}

export async function createCategory(payload) {
  const response = await httpClient.post(endpoints.admin.categories.list, payload);
  return response.data;
}

export async function updateCategory(categoryId, payload) {
  const response = await httpClient.put(endpoints.admin.categories.detail(categoryId), payload);
  return response.data;
}

export async function updateCategoryActive(categoryId, isActive) {
  await httpClient.patch(endpoints.admin.categories.active(categoryId), { isActive });
}

export async function reorderCategories(items) {
  await httpClient.put(endpoints.admin.categories.reorder, { items });
}

export async function deleteCategory(categoryId) {
  await httpClient.delete(endpoints.admin.categories.detail(categoryId));
}

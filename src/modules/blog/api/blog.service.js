import { buildPageQuery, endpoints, httpClient, normalizePagedResponse } from 'shared/api';

function normalizeArrayPayload(payload, key) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.[key])) {
    return payload[key];
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

export async function getBlogCategories() {
  const response = await httpClient.get(endpoints.admin.blog.categories);
  return normalizeArrayPayload(response.data, 'categories');
}

export async function createBlogCategory(payload) {
  const response = await httpClient.post(endpoints.admin.blog.categories, payload);
  return response.data;
}

export async function updateBlogCategory(id, payload) {
  const response = await httpClient.put(endpoints.admin.blog.categoryDetail(id), payload);
  return response.data;
}

export async function deleteBlogCategory(id) {
  await httpClient.delete(endpoints.admin.blog.categoryDetail(id));
}

export async function getBlogTags() {
  const response = await httpClient.get(endpoints.admin.blog.tags);
  return normalizeArrayPayload(response.data, 'tags');
}

export async function createBlogTag(payload) {
  const response = await httpClient.post(endpoints.admin.blog.tags, payload);
  return response.data;
}

export async function updateBlogTag(id, payload) {
  const response = await httpClient.put(endpoints.admin.blog.tagDetail(id), payload);
  return response.data;
}

export async function deleteBlogTag(id) {
  await httpClient.delete(endpoints.admin.blog.tagDetail(id));
}

export async function getBlogPosts(params = {}) {
  const paging = buildPageQuery({ page: params.page, pageSize: params.pageSize });

  const response = await httpClient.get(endpoints.admin.blog.posts, {
    params: {
      ...paging,
      categoryId: params.categoryId,
      search: params.search,
      status: params.status
    }
  });

  return normalizePagedResponse(response.data, paging);
}

export async function getBlogPostDetail(postId) {
  const response = await httpClient.get(endpoints.admin.blog.postDetail(postId));
  return response.data;
}

export async function createBlogPost(payload) {
  const response = await httpClient.post(endpoints.admin.blog.posts, payload);
  return response.data;
}

export async function updateBlogPost(postId, payload) {
  const response = await httpClient.put(endpoints.admin.blog.postDetail(postId), payload);
  return response.data;
}

export async function publishBlogPost(postId) {
  await httpClient.patch(endpoints.admin.blog.postPublish(postId), {});
}

export async function unpublishBlogPost(postId) {
  await httpClient.patch(endpoints.admin.blog.postUnpublish(postId), {});
}

export async function archiveBlogPost(postId) {
  await httpClient.patch(endpoints.admin.blog.postArchive(postId), {});
}

export async function uploadBlogPostCover(postId, file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await httpClient.post(endpoints.admin.blog.postCover(postId), formData);
  return response.data;
}

export async function deleteBlogPostCover(postId) {
  await httpClient.delete(endpoints.admin.blog.postCover(postId));
}

export async function uploadBlogPostPhotos(postId, files) {
  const formData = new FormData();
  (files || []).forEach((file) => {
    formData.append('Photos', file);
  });

  const response = await httpClient.post(endpoints.admin.blog.postPhotos(postId), formData);
  return response.data;
}

export async function deleteBlogPostPhoto(postId, photoId) {
  const response = await httpClient.delete(endpoints.admin.blog.postPhotoDetail(postId, photoId));
  return response.data;
}

export async function deleteBlogPost(postId) {
  await httpClient.delete(endpoints.admin.blog.postDetail(postId));
}

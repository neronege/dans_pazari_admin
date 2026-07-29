import { buildPageQuery, endpoints, httpClient, normalizePagedResponse } from 'shared/api';

export async function getUsers(params = {}) {
  const paging = buildPageQuery({
    page: params.page,
    pageSize: params.pageSize
  });

  const response = await httpClient.get(endpoints.admin.users.list, {
    params: {
      ...paging,
      search: params.search,
      status: params.status,
      isGuest: params.isGuest
    }
  });

  return normalizePagedResponse(response.data, paging);
}

export async function getUserDetail(userId) {
  const response = await httpClient.get(endpoints.admin.users.detail(userId));
  return response.data;
}

export async function suspendUser(userId, reason) {
  const response = await httpClient.patch(endpoints.admin.users.suspend(userId), { reason });
  return response.data;
}

export async function banUser(userId, reason) {
  const response = await httpClient.patch(endpoints.admin.users.ban(userId), { reason });
  return response.data;
}

export async function activateUser(userId) {
  const response = await httpClient.patch(endpoints.admin.users.activate(userId), {});
  return response.data;
}

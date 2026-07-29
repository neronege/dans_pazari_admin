import { buildPageQuery, endpoints, httpClient, normalizePagedResponse } from 'shared/api';

export async function getRaffles(params = {}) {
  const paging = buildPageQuery({ page: params.page, pageSize: params.pageSize });

  const response = await httpClient.get(endpoints.admin.raffles.list, {
    params: {
      ...paging,
      status: params.status,
      search: params.search
    }
  });

  return normalizePagedResponse(response.data, paging);
}

export async function getRaffleDetail(raffleId) {
  const response = await httpClient.get(endpoints.admin.raffles.detail(raffleId));
  return response.data;
}

export async function createRaffle(payload) {
  const response = await httpClient.post(endpoints.admin.raffles.list, payload);
  return response.data;
}

export async function updateRaffle(raffleId, payload) {
  const response = await httpClient.put(endpoints.admin.raffles.detail(raffleId), payload);
  return response.data;
}

export async function deleteRaffle(raffleId) {
  await httpClient.delete(endpoints.admin.raffles.detail(raffleId));
}

export async function scheduleRaffle(raffleId) {
  await httpClient.patch(endpoints.admin.raffles.schedule(raffleId), {});
}

export async function openRaffle(raffleId) {
  await httpClient.patch(endpoints.admin.raffles.open(raffleId), {});
}

export async function cancelRaffle(raffleId) {
  await httpClient.patch(endpoints.admin.raffles.cancel(raffleId), {});
}

export async function getRaffleEntries(raffleId, params = {}) {
  const paging = buildPageQuery({ page: params.page, pageSize: params.pageSize });
  const response = await httpClient.get(endpoints.admin.raffles.entries(raffleId), {
    params: {
      ...paging,
      status: params.status
    }
  });

  return normalizePagedResponse(response.data, paging);
}

export async function getRaffleWinners(raffleId) {
  const response = await httpClient.get(endpoints.admin.raffles.winners(raffleId));
  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.data?.items)) {
    return response.data.items;
  }

  return [];
}

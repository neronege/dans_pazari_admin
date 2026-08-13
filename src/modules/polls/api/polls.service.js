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

export async function getPolls() {
  const response = await httpClient.get(endpoints.admin.polls.list);
  return normalizeList(response.data);
}

export async function getPollDetail(id) {
  const response = await httpClient.get(endpoints.admin.polls.detail(id));
  return response.data;
}

export async function createPoll(payload) {
  const response = await httpClient.post(endpoints.admin.polls.list, payload);
  return response.data;
}

export async function updatePoll(id, payload) {
  const response = await httpClient.put(endpoints.admin.polls.detail(id), payload);
  return response.data;
}

export async function deletePoll(id) {
  await httpClient.delete(endpoints.admin.polls.detail(id));
}

export async function publishPoll(id) {
  const response = await httpClient.patch(endpoints.admin.polls.publish(id), {});
  return response.data;
}

export async function unpublishPoll(id) {
  const response = await httpClient.patch(endpoints.admin.polls.unpublish(id), {});
  return response.data;
}

export async function setPollHomepage(id, showOnHomepage) {
  const response = await httpClient.patch(endpoints.admin.polls.homepage(id), { showOnHomepage });
  return response.data;
}

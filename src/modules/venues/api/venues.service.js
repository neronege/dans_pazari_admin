import { endpoints, httpClient } from 'shared/api';

function normalizeListPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.venues)) {
    return payload.venues;
  }

  return [];
}

export async function getVenues(params = {}) {
  const response = await httpClient.get(endpoints.admin.venues.list, { params });
  return normalizeListPayload(response.data);
}

export async function getVenueDetail(venueId) {
  const response = await httpClient.get(endpoints.admin.venues.detail(venueId));
  return response.data;
}

export async function createVenue(payload) {
  const response = await httpClient.post(endpoints.admin.venues.list, payload);
  return response.data;
}

export async function updateVenue(venueId, payload) {
  const response = await httpClient.put(endpoints.admin.venues.detail(venueId), payload);
  return response.data;
}

export async function updateVenueActive(venueId, isActive) {
  await httpClient.patch(endpoints.admin.venues.active(venueId), { isActive });
}

export async function deleteVenue(venueId) {
  await httpClient.delete(endpoints.admin.venues.detail(venueId));
}

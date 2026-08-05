import { endpoints, httpClient } from 'shared/api';

function normalizeListPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.events)) {
    return payload.events;
  }

  return [];
}

export async function getEvents(params = {}) {
  const response = await httpClient.get(endpoints.admin.events.list, { params });
  return normalizeListPayload(response.data);
}

export async function getEventDetail(eventId) {
  const response = await httpClient.get(endpoints.admin.events.detail(eventId));
  return response.data;
}

export async function createEvent(payload) {
  const response = await httpClient.post(endpoints.admin.events.list, payload);
  return response.data;
}

export async function updateEvent(eventId, payload) {
  const response = await httpClient.put(endpoints.admin.events.detail(eventId), payload);
  return response.data;
}

export async function publishEvent(eventId) {
  await httpClient.patch(endpoints.admin.events.publish(eventId), {});
}

export async function unpublishEvent(eventId) {
  await httpClient.patch(endpoints.admin.events.unpublish(eventId), {});
}

export async function cancelEvent(eventId) {
  await httpClient.patch(endpoints.admin.events.cancel(eventId), {});
}

export async function setEventFeatured(eventId, isFeatured) {
  await httpClient.patch(endpoints.admin.events.featured(eventId), { isFeatured });
}

export async function setEventSortOrder(eventId, sortOrder) {
  await httpClient.patch(endpoints.admin.events.sortOrder(eventId), { sortOrder });
}

export async function deleteEvent(eventId) {
  await httpClient.delete(endpoints.admin.events.detail(eventId));
}

export async function uploadEventCover(eventId, file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await httpClient.post(endpoints.admin.events.cover(eventId), formData);
  return response.data;
}

export async function deleteEventCover(eventId) {
  await httpClient.delete(endpoints.admin.events.cover(eventId));
}

export async function uploadEventPhotos(eventId, files = []) {
  const formData = new FormData();
  (files || []).forEach((file) => {
    if (file) {
      formData.append('Photos', file);
    }
  });

  const response = await httpClient.post(endpoints.admin.events.photos(eventId), formData);
  return response.data;
}

export async function deleteEventPhoto(eventId, photoId) {
  await httpClient.delete(endpoints.admin.events.photoDetail(eventId, photoId));
}

export async function uploadEventBanner(eventId, file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await httpClient.post(endpoints.admin.events.banner(eventId), formData);
  return response.data;
}

export async function deleteEventBanner(eventId) {
  await httpClient.delete(endpoints.admin.events.banner(eventId));
}

export async function createEventSession(eventId, payload) {
  const response = await httpClient.post(endpoints.admin.events.sessions(eventId), payload);
  return response.data;
}

export async function updateEventSession(eventId, sessionId, payload) {
  const response = await httpClient.put(endpoints.admin.events.sessionDetail(eventId, sessionId), payload);
  return response.data;
}

export async function cancelEventSession(eventId, sessionId) {
  await httpClient.patch(endpoints.admin.events.sessionCancel(eventId, sessionId), {});
}

export async function deleteEventSession(eventId, sessionId) {
  await httpClient.delete(endpoints.admin.events.sessionDetail(eventId, sessionId));
}

export async function createTicketType(eventId, sessionId, payload) {
  const response = await httpClient.post(endpoints.admin.events.ticketTypes(eventId, sessionId), payload);
  return response.data;
}

export async function updateTicketType(eventId, sessionId, ticketTypeId, payload) {
  const response = await httpClient.put(endpoints.admin.events.ticketTypeDetail(eventId, sessionId, ticketTypeId), payload);
  return response.data;
}

export async function deleteTicketType(eventId, sessionId, ticketTypeId) {
  await httpClient.delete(endpoints.admin.events.ticketTypeDetail(eventId, sessionId, ticketTypeId));
}

export async function startBulkRefunds(eventId, reason) {
  const response = await httpClient.post(endpoints.admin.events.bulkRefunds(eventId), { reason });
  return response.data;
}

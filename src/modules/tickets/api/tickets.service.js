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

/**
 * Kapı görevlisi + admin: etkinlik listesi (scan bağlamı).
 */
export async function getGateEvents(params = {}) {
  const response = await httpClient.get(endpoints.admin.gate.events, { params });
  return normalizeListPayload(response.data);
}

export async function getGateEventDetail(eventId) {
  const response = await httpClient.get(endpoints.admin.gate.eventDetail(eventId));
  return response.data;
}

/**
 * @param {{ payload: string, expectedEventId?: string, expectedSessionId?: string }} body
 */
export async function scanTicket(body) {
  const payload = typeof body === 'string' ? { payload: body } : body;
  const response = await httpClient.post(endpoints.admin.tickets.scan, {
    payload: payload.payload,
    expectedEventId: payload.expectedEventId || undefined,
    expectedSessionId: payload.expectedSessionId || undefined
  });
  return response.data;
}

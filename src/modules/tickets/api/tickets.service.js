import { endpoints, httpClient } from 'shared/api';

export async function scanTicket(payload) {
  const response = await httpClient.post(endpoints.admin.tickets.scan, { payload });
  return response.data;
}

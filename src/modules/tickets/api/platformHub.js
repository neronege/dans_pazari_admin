import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { getAccessToken } from 'shared/api';

function getHubUrl() {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  return `${base}/hubs/platform`;
}

/**
 * Admin JWT ile `/hubs/platform` bağlantısı.
 * @returns {import('@microsoft/signalr').HubConnection}
 */
export function createPlatformHubConnection() {
  return new HubConnectionBuilder()
    .withUrl(getHubUrl(), {
      accessTokenFactory: () => getAccessToken() || ''
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}

export async function ensureHubStarted(connection) {
  if (!connection) {
    return;
  }
  if (connection.state === HubConnectionState.Disconnected) {
    await connection.start();
  }
}

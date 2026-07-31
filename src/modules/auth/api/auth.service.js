import { endpoints, getRefreshToken, httpClient, setTokens, clearTokens } from 'shared/api';

function toAuthPayload(payload) {
  return {
    email: payload?.email,
    password: payload?.password
  };
}

function assertAdminUser(user) {
  if (!user || user.role !== 'Admin') {
    const error = new Error('Bu hesap admin paneline erisemiyor.');
    error.code = 'forbidden_non_admin';
    throw error;
  }
}

export async function login(payload) {
  const response = await httpClient.post(endpoints.auth.login, toAuthPayload(payload), { skipAuth: true });
  return response.data;
}

export async function loginAndStoreSession(payload) {
  const data = await login(payload);
  assertAdminUser(data?.user);
  setTokens(data?.tokens);
  return data;
}

export async function refreshSession(refreshTokenOverride) {
  const refreshToken = refreshTokenOverride || getRefreshToken();

  const response = await httpClient.post(
    endpoints.auth.refresh,
    { refreshToken },
    {
      skipAuth: true
    }
  );

  const data = response.data;
  assertAdminUser(data?.user);
  setTokens(data?.tokens);
  return data;
}

export async function logout() {
  const refreshToken = getRefreshToken();

  try {
    if (refreshToken) {
      await httpClient.post(
        endpoints.auth.logout,
        { refreshToken },
        {
          skipAuth: true
        }
      );
    }
  } finally {
    clearTokens();
  }
}

export async function pingAdmin() {
  const response = await httpClient.get(endpoints.auth.adminPing);
  return response.data;
}

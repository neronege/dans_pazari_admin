import { endpoints, getRefreshToken, httpClient, setTokens, clearTokens } from 'shared/api';

const USE_MOCK_AUTH = true;

const MOCK_ADMIN_ACCOUNT = {
  id: 'mock-admin-1',
  email: 'demo@local.test',
  password: '123456',
  fullName: 'Mock Admin',
  role: 'Admin'
};

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

function toBase64Url(value) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function createMockAccessToken(user) {
  const header = toBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = toBase64Url(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.fullName,
      role: user.role,
      exp: now + 60 * 60 * 8
    })
  );

  return `${header}.${payload}.mock`;
}

function createMockSessionData() {
  const accessToken = createMockAccessToken(MOCK_ADMIN_ACCOUNT);
  const refreshToken = `mock-refresh-${MOCK_ADMIN_ACCOUNT.id}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 8 * 1000).toISOString();

  return {
    user: {
      id: MOCK_ADMIN_ACCOUNT.id,
      email: MOCK_ADMIN_ACCOUNT.email,
      fullName: MOCK_ADMIN_ACCOUNT.fullName,
      role: MOCK_ADMIN_ACCOUNT.role
    },
    tokens: {
      accessToken,
      refreshToken,
      accessTokenExpiresAtUtc: expiresAt
    }
  };
}

function loginWithMock(payload) {
  const email = String(payload?.email || '')
    .trim()
    .toLowerCase();
  const password = String(payload?.password || '');

  if (email !== MOCK_ADMIN_ACCOUNT.email || password !== MOCK_ADMIN_ACCOUNT.password) {
    const error = new Error('E-posta veya sifre hatali.');
    error.code = 'invalid_credentials';
    throw error;
  }

  return createMockSessionData();
}

export async function login(payload) {
  if (USE_MOCK_AUTH) {
    return loginWithMock(payload);
  }

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

  if (USE_MOCK_AUTH) {
    if (!refreshToken || !refreshToken.startsWith('mock-refresh-')) {
      const error = new Error('Mock oturum yenilenemedi.');
      error.code = 'invalid_refresh_token';
      throw error;
    }

    const data = createMockSessionData();
    setTokens(data.tokens);
    return data;
  }

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
  if (USE_MOCK_AUTH) {
    clearTokens();
    return;
  }

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
  if (USE_MOCK_AUTH) {
    return {
      isAuthenticated: true,
      role: 'Admin',
      source: 'mock'
    };
  }

  const response = await httpClient.get(endpoints.auth.adminPing);
  return response.data;
}

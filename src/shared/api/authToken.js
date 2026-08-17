const ACCESS_TOKEN_KEY = 'dp_admin_access_token';
const REFRESH_TOKEN_KEY = 'dp_admin_refresh_token';
const TOKEN_EXPIRY_KEY = 'dp_admin_access_token_expires_at_utc';
const USER_KEY = 'dp_admin_user';
const BUILD_ID_KEY = 'dp_admin_build_id';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getAdminBuildId() {
  return process.env.NEXT_PUBLIC_ADMIN_BUILD_ID || '';
}

function stampBuildId() {
  const current = getAdminBuildId();
  if (!isBrowser() || !current) {
    return;
  }

  window.localStorage.setItem(BUILD_ID_KEY, current);
}

/** Yeni sunucu build’inde kayıtlı oturumu siler. */
export function logoutIfAdminBuildChanged() {
  if (!isBrowser()) {
    return false;
  }

  const current = getAdminBuildId();
  if (!current) {
    return false;
  }

  const stored = window.localStorage.getItem(BUILD_ID_KEY);
  if (!stored) {
    stampBuildId();
    return false;
  }

  if (stored === current) {
    return false;
  }

  clearTokens();
  stampBuildId();
  return true;
}

export function getAccessToken() {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getAccessTokenExpiryUtc() {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(TOKEN_EXPIRY_KEY);
}

export function getCurrentUser() {
  if (!isBrowser()) {
    return null;
  }

  const rawUser = window.localStorage.getItem(USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function setTokens(tokens) {
  if (!isBrowser() || !tokens) {
    return;
  }

  const { accessToken, refreshToken, accessTokenExpiresAtUtc } = tokens;

  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  if (accessTokenExpiresAtUtc) {
    window.localStorage.setItem(TOKEN_EXPIRY_KEY, accessTokenExpiresAtUtc);
  }

  stampBuildId();
}

export function setCurrentUser(user) {
  if (!isBrowser()) {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(USER_KEY);
    return;
  }

  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearTokens() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_EXPIRY_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export const tokenStorageKeys = {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  TOKEN_EXPIRY_KEY,
  USER_KEY
};

const ACCESS_TOKEN_KEY = 'dp_admin_access_token';
const REFRESH_TOKEN_KEY = 'dp_admin_refresh_token';
const TOKEN_EXPIRY_KEY = 'dp_admin_access_token_expires_at_utc';

function isBrowser() {
  return typeof window !== 'undefined';
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
}

export function clearTokens() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export const tokenStorageKeys = {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  TOKEN_EXPIRY_KEY
};

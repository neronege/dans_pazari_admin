function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLength);
  return atob(padded);
}

export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const decoded = decodeBase64Url(parts[1]);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function isAdminPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const directRole = payload.role;
  const schemaRole = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

  if (directRole === 'Admin' || schemaRole === 'Admin') {
    return true;
  }

  if (Array.isArray(directRole) && directRole.includes('Admin')) {
    return true;
  }

  if (Array.isArray(schemaRole) && schemaRole.includes('Admin')) {
    return true;
  }

  return false;
}

export function isAdminAccessToken(token) {
  const payload = decodeJwtPayload(token);
  return isAdminPayload(payload);
}

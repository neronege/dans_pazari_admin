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

function asRoleList(payload) {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const directRole = payload.role;
  const schemaRole = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  const directList = Array.isArray(directRole) ? directRole : directRole ? [directRole] : [];
  const schemaList = Array.isArray(schemaRole) ? schemaRole : schemaRole ? [schemaRole] : [];
  return [...new Set([...directList, ...schemaList].filter(Boolean))];
}

export function getRolesFromPayload(payload) {
  return asRoleList(payload);
}

export function getRolesFromAccessToken(token) {
  return getRolesFromPayload(decodeJwtPayload(token));
}

export function isAdminPayload(payload) {
  return getRolesFromPayload(payload).includes('Admin');
}

export function isDoorStaffPayload(payload) {
  return getRolesFromPayload(payload).includes('DoorStaff');
}

/** Admin paneline giriş: Admin veya DoorStaff */
export function isPanelPayload(payload) {
  const roles = getRolesFromPayload(payload);
  return roles.includes('Admin') || roles.includes('DoorStaff');
}

export function isAdminAccessToken(token) {
  return isAdminPayload(decodeJwtPayload(token));
}

export function isPanelAccessToken(token) {
  return isPanelPayload(decodeJwtPayload(token));
}

export function isDoorStaffOnlyToken(token) {
  const roles = getRolesFromAccessToken(token);
  return roles.includes('DoorStaff') && !roles.includes('Admin');
}

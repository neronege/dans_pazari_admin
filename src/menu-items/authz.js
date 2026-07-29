import { getAccessToken } from 'shared/api';
import { decodeJwtPayload } from 'modules/auth/model/jwt';

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

export function getCurrentUserRoles() {
  const token = getAccessToken();
  const payload = decodeJwtPayload(token);
  return asRoleList(payload);
}

export function canAccessItem(item, roles) {
  if (!item?.requiredRoles || item.requiredRoles.length === 0) {
    return true;
  }

  return item.requiredRoles.some((role) => roles.includes(role));
}

export function filterMenuByRoles(menuItems, roles) {
  return menuItems
    .filter((group) => canAccessItem(group, roles))
    .map((group) => ({
      ...group,
      children: (group.children || []).filter((child) => canAccessItem(child, roles))
    }))
    .filter((group) => (group.children || []).length > 0);
}

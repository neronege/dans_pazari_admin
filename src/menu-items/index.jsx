import menuRegistry from './registry';
import { filterMenuByRoles, getCurrentUserRoles } from './authz';

// ==============================|| MENU ITEMS ||============================== //

export function getMenuItems() {
  const roles = getCurrentUserRoles();

  return {
    items: filterMenuByRoles(menuRegistry, roles)
  };
}

const menuItems = getMenuItems();

export default menuItems;

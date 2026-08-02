'use client';

import PropTypes from 'prop-types';

// project imports
import DashboardLayout from 'layout/Dashboard';
import useAutoLogoutOnInactivity from 'modules/auth/hooks/useAutoLogoutOnInactivity';
import useRequireAdmin from 'modules/auth/hooks/useRequireAdmin';

// ==============================|| DASHBOARD LAYOUT ||============================== //

export default function Layout({ children }) {
  useAutoLogoutOnInactivity();
  const { isAuthorized, isChecking } = useRequireAdmin();

  if (isChecking || !isAuthorized) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

Layout.propTypes = { children: PropTypes.node };

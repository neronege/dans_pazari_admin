'use client';

import PropTypes from 'prop-types';

// project imports
import DashboardLayout from 'layout/Dashboard';
import useRequireAdmin from 'modules/auth/hooks/useRequireAdmin';

// ==============================|| DASHBOARD LAYOUT ||============================== //

export default function Layout({ children }) {
  const { isAuthorized, isChecking } = useRequireAdmin();

  if (isChecking || !isAuthorized) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

Layout.propTypes = { children: PropTypes.node };

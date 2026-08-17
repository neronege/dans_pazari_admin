'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { logoutIfAdminBuildChanged } from 'shared/api';

export default function AdminBuildSessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const loggedOut = logoutIfAdminBuildChanged();
    if (!loggedOut) {
      return;
    }

    if (pathname === '/login' || pathname?.startsWith('/login')) {
      return;
    }

    router.replace('/login');
  }, [pathname, router]);

  return null;
}

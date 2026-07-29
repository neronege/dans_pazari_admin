'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearTokens, getAccessToken } from 'shared/api';
import { isAdminAccessToken } from 'modules/auth/model/jwt';

export default function useRequireAdmin() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken || !isAdminAccessToken(accessToken)) {
      clearTokens();
      setIsAuthorized(false);
      setIsChecking(false);

      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${next}`);
      return;
    }

    setIsAuthorized(true);
    setIsChecking(false);
  }, [pathname, router]);

  return {
    isAuthorized,
    isChecking
  };
}

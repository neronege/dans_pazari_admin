'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearTokens, getAccessToken, getAccessTokenExpiryUtc } from 'shared/api';
import { decodeJwtPayload, isAdminAccessToken } from 'modules/auth/model/jwt';

function isAccessTokenExpired(accessToken) {
  const now = Date.now();
  const explicitExpiryUtc = getAccessTokenExpiryUtc();

  if (explicitExpiryUtc) {
    const explicitExpiryMs = Date.parse(explicitExpiryUtc);
    if (Number.isFinite(explicitExpiryMs)) {
      return explicitExpiryMs <= now;
    }
  }

  const payload = decodeJwtPayload(accessToken);
  const expSeconds = Number(payload?.exp);
  if (Number.isFinite(expSeconds) && expSeconds > 0) {
    return expSeconds * 1000 <= now;
  }

  return false;
}

export default function useRequireAdmin() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken || isAccessTokenExpired(accessToken) || !isAdminAccessToken(accessToken)) {
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

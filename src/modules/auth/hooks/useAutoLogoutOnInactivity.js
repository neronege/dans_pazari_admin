'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from 'shared/api';
import { logout } from 'modules/auth/api';

const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];
const MIN_RESET_INTERVAL_MS = 1000;

function resolveIdleTimeoutMs() {
  const fromEnv = Number(process.env.NEXT_PUBLIC_ADMIN_IDLE_LOGOUT_MS);

  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return fromEnv;
  }

  return DEFAULT_IDLE_TIMEOUT_MS;
}

export default function useAutoLogoutOnInactivity() {
  const router = useRouter();
  const timeoutRef = useRef(null);
  const isLoggingOutRef = useRef(false);
  const lastResetAtRef = useRef(0);
  const idleTimeoutMs = resolveIdleTimeoutMs();

  const clearExistingTimer = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const performLogout = useCallback(async () => {
    if (isLoggingOutRef.current || !getAccessToken()) {
      return;
    }

    isLoggingOutRef.current = true;
    clearExistingTimer();

    try {
      await logout();
    } finally {
      router.replace('/login');
    }
  }, [clearExistingTimer, router]);

  const resetIdleTimer = useCallback(
    (force = false) => {
      const now = Date.now();
      if (!force && now - lastResetAtRef.current < MIN_RESET_INTERVAL_MS) {
        return;
      }

      lastResetAtRef.current = now;

      if (!getAccessToken()) {
        clearExistingTimer();
        return;
      }

      clearExistingTimer();
      timeoutRef.current = window.setTimeout(() => {
        void performLogout();
      }, idleTimeoutMs);
    },
    [clearExistingTimer, idleTimeoutMs, performLogout]
  );

  useEffect(() => {
    const handleActivity = () => {
      resetIdleTimer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetIdleTimer(true);
      }
    };

    resetIdleTimer(true);
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity);
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearExistingTimer();
    };
  }, [clearExistingTimer, resetIdleTimer]);
}
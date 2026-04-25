import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { appKit } from '@/config/walletConfig';

const TIMEOUT_MS = 5 * 60 * 1000;
const EVENTS: string[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

interface UseSessionTimeoutOptions {
  onExpired?: () => void;
}

export const useSessionTimeout = ({ onExpired }: UseSessionTimeoutOptions = {}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    try {
      appKit.disconnect();
    } catch (_) {
      // appKit throws if no wallet is connected — safe to ignore
    }

    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    queryClient.clear();
    onExpired?.();
    window.location.href = '/login';
  }, [queryClient, onExpired]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    resetTimer();
    EVENTS.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [resetTimer]);
};

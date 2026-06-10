// frontend/src/hooks/useAdminAccess.ts
//
// Single source of truth for "is the current user an admin?" The backend
// gives us a boolean via GET /api/admin/access — cheaper than probing
// /api/admin/stats and doesn't reveal the admin wallet list to the SPA.
//
// Used by:
//   - AdminRoute  (the /admin gate)
//   - Login.tsx   (post-login redirect to /admin instead of role dashboard)
//   - Any user dashboard that wants to surface an "Admin" entry point.

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

type AccessResponse = { isAdmin: boolean };

export function useAdminAccess() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const q = useQuery({
    queryKey: ['admin', 'access'],
    queryFn: () => api.get<AccessResponse>('/api/admin/access'),
    enabled: isAuthenticated && !authLoading,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60_000,
  });

  return {
    isAdmin: q.data?.isAdmin ?? false,
    isLoading: authLoading || q.isLoading,
    isError: q.isError,
    error: q.error,
  };
}

// frontend/src/components/AdminRoute.tsx
//
// Admin gate. Wraps the /admin/* routes.
//
// Why a separate component instead of reusing ProtectedRoute with
// roles={['admin']}? Backend admin status is determined by wallet
// match against ADMIN_WALLETS, NOT by user.role — a user with
// role="issuer" can be an admin too. The only authoritative answer
// is the backend, so the guard pings /api/admin/stats once on mount.
//
// Behavior:
//   - not authenticated     -> redirect to /login
//   - probing the backend   -> show a small centered spinner
//   - backend says 200      -> render children
//   - backend says 403      -> redirect home (no access)
//   - backend says 5xx      -> render an inline error with a retry CTA
//                              (do NOT silently 200; ops might be down)

import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/services/admin';
import { ApiServiceError } from '@/services/api';

interface AdminRouteProps {
  children: React.ReactNode;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md mx-auto p-6">{children}</div>
    </div>
  );
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // The lightest admin endpoint we have. A 200 here proves the wallet is in
  // ADMIN_WALLETS on the backend without us having to expose the list to
  // the frontend.
  const probe = useQuery({
    queryKey: ['admin-access-probe'],
    queryFn: () => adminApi.stats(),
    enabled: isAuthenticated && !authLoading,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  if (authLoading) {
    return (
      <Centered>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto" />
      </Centered>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (probe.isLoading) {
    return (
      <Centered>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Verificando acceso de administrador…</p>
      </Centered>
    );
  }

  if (probe.error) {
    const status = probe.error instanceof ApiServiceError ? probe.error.status : null;
    if (status === 403) return <Navigate to="/" replace />;
    return (
      <Centered>
        <h2 className="text-xl font-title">No se pudo verificar el acceso</h2>
        <p className="text-sm text-muted-foreground">
          El servidor respondió con un error. Por favor reintenta.
        </p>
        <button
          type="button"
          onClick={() => probe.refetch()}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90"
        >
          Reintentar
        </button>
      </Centered>
    );
  }

  return <>{children}</>;
}

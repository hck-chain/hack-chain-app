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

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';

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
  const { isAdmin, isLoading: probeLoading, isError } = useAdminAccess();

  if (authLoading) {
    return (
      <Centered>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto" />
      </Centered>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (probeLoading) {
    return (
      <Centered>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Verificando acceso de administrador…</p>
      </Centered>
    );
  }

  if (isError) {
    return (
      <Centered>
        <h2 className="text-xl font-title">No se pudo verificar el acceso</h2>
        <p className="text-sm text-muted-foreground">
          El servidor respondió con un error. Por favor reintenta.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90"
        >
          Reintentar
        </button>
      </Centered>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}

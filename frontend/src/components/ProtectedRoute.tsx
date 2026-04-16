import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

/**
 * Route guard that checks authentication and optionally role access.
 *
 * Usage:
 * ```tsx
 * <Route path="/educator/dashboard" element={
 *   <ProtectedRoute roles={['issuer']}>
 *     <EducatorDashboard />
 *   </ProtectedRoute>
 * } />
 * ```
 */
export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Still checking localStorage — show nothing (or a spinner)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role check (if roles are specified)
  if (roles && roles.length > 0 && user) {
    if (!roles.includes(user.role)) {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}

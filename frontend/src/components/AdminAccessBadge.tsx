// frontend/src/components/AdminAccessBadge.tsx
//
// Small entry point for users whose wallet is in ADMIN_WALLETS but who
// landed on a regular role dashboard (e.g. a CTO that registered as
// student to get a feel for the talent UX). Renders nothing for
// non-admins, so it is safe to drop into any page.
//
// Two presentations:
//   variant="pill"   — compact rounded button, good for header rows
//   variant="banner" — full-width strip, good for top-of-page nudges

import { Link, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAdminAccess } from '@/hooks/useAdminAccess';

type Variant = 'pill' | 'banner';

interface AdminAccessBadgeProps {
  variant?: Variant;
  className?: string;
}

export default function AdminAccessBadge({ variant = 'pill', className = '' }: AdminAccessBadgeProps) {
  const { isAdmin } = useAdminAccess();
  const location = useLocation();

  // Don't render on /admin/* — you're already there.
  if (!isAdmin) return null;
  if (location.pathname.startsWith('/admin')) return null;

  if (variant === 'banner') {
    return (
      <Link
        to="/admin"
        className={`flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors p-3 ${className}`}
      >
        <div className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 text-primary" />
          <span>Tenés acceso de administrador. Abrí el panel para revisar el estado del sistema.</span>
        </div>
        <span className="text-xs font-semibold text-primary">Ir →</span>
      </Link>
    );
  }

  return (
    <Link
      to="/admin"
      className={`inline-flex items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold px-3 py-1 ring-1 ring-primary/30 transition-colors ${className}`}
    >
      <Shield className="h-3.5 w-3.5" />
      Admin
    </Link>
  );
}

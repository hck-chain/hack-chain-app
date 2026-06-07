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
      className={`group relative inline-flex items-center gap-2 rounded-full bg-background/60 backdrop-blur-xl border border-white/10 hover:border-primary/50 px-4 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
      
      <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
        <div className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-75" />
        <Shield className="h-3.5 w-3.5 text-primary relative z-10" />
      </div>
      
      <span className="relative z-10 text-sm font-semibold tracking-wide text-white/90 group-hover:text-white transition-colors">
        Admin
      </span>
    </Link>
  );
}

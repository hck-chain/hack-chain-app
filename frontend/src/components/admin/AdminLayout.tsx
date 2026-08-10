// frontend/src/components/admin/AdminLayout.tsx
//
// Two-column shell shared by every /admin/* page. Sidebar nav on the
// left, page content on the right via <Outlet />. Reuses the global
// Layout (background animation + footer) so the admin section feels
// part of the same product, not a side console.

import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Banknote,
  ShieldAlert,
  LogOut,
  Menu,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
// LanguageToggle removido a pedido — el admin queda en español para launch.

const HackChainLogo = '/favicon.ico';

type NavItem = { to: string; label: string; icon: React.ReactNode };

const NAV: NavItem[] = [
  { to: '/admin',           label: 'Resumen',   icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: '/admin/educators', label: 'Educators', icon: <Users           className="h-4 w-4" /> },
  { to: '/admin/payments',  label: 'Pagos',     icon: <Receipt         className="h-4 w-4" /> },
  { to: '/admin/treasury',  label: 'Treasury',  icon: <Banknote        className="h-4 w-4" /> },
  { to: '/admin/payment-disputes', label: 'Disputas', icon: <ShieldAlert className="h-4 w-4" /> },
];

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/admin'}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-body transition-colors',
          isActive
            ? 'bg-primary/15 text-primary font-semibold'
            : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
        ].join(' ')
      }
    >
      {item.icon}
      <span>{item.label}</span>
    </NavLink>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={HackChainLogo}
        alt="HackChain"
        className={compact ? 'h-8 w-8' : 'h-10 w-10'}
      />
      <div>
        <p className={`font-title leading-none text-primary ${compact ? 'text-base' : 'text-lg'}`}>HackChain</p>
        <p className="text-xs text-muted-foreground tracking-wider uppercase">Admin</p>
      </div>
    </div>
  );
}

function backDashboardFor(role: string | undefined | null): { to: string; label: string } | null {
  if (role === 'student')   return { to: '/dashboard/talent',    label: 'Mi cuenta (talent)' };
  if (role === 'issuer')    return { to: '/educator/dashboard',  label: 'Mi cuenta (educator)' };
  if (role === 'recruiter') return { to: '/dashboard/recruiter', label: 'Mi cuenta (recruiter)' };
  return null;
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const back = backDashboardFor(user?.role);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="space-y-6">
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      {back && (
        <div className="pt-4 border-t border-border/60">
          <NavLink
            to={back.to}
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-body text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 rotate-180" />
            <span>{back.label}</span>
          </NavLink>
        </div>
      )}

      <div className="pt-4 border-t border-border/60">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const currentLabel = NAV.find((n) => (n.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(n.to)))?.label ?? 'Admin';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* ---- Mobile top bar (sticky) ---- */}
        <div className="lg:hidden sticky top-0 z-30 -mx-4 px-4 py-3 mb-4 bg-background/85 backdrop-blur-md border-b border-border/60 flex items-center justify-between">
          <BrandMark compact />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 sm:w-80">
              <div className="mt-2 mb-6"><BrandMark /></div>
              <SidebarBody onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* ---- Desktop sidebar ---- */}
          <aside className="hidden lg:block lg:sticky lg:top-8 self-start space-y-6">
            <BrandMark />
            <SidebarBody />
          </aside>

          {/* ---- Page slot ---- */}
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </Layout>
  );
}

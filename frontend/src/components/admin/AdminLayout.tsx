// frontend/src/components/admin/AdminLayout.tsx
//
// Two-column shell shared by every /admin/* page. Sidebar nav on the
// left, page content on the right via <Outlet />. Reuses the global
// Layout (background animation + footer) so the admin section feels
// part of the same product, not a side console.

import { NavLink, Outlet } from 'react-router-dom';
import Layout from '@/components/Layout';
import { LanguageToggle } from '@/components/LanguageToggle';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Banknote,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const HackChainLogo = '/images/logoHackchain2.webp';

type NavItem = { to: string; label: string; icon: React.ReactNode };

const NAV: NavItem[] = [
  { to: '/admin',           label: 'Resumen',   icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: '/admin/educators', label: 'Educators', icon: <Users           className="h-4 w-4" /> },
  { to: '/admin/payments',  label: 'Pagos',     icon: <Receipt         className="h-4 w-4" /> },
  { to: '/admin/treasury',  label: 'Treasury',  icon: <Banknote        className="h-4 w-4" /> },
];

function SidebarLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/admin'}
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

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* ---- Sidebar ---- */}
          <aside className="lg:sticky lg:top-8 self-start space-y-6">
            <div className="flex items-center gap-3">
              <img
                src={HackChainLogo}
                alt="HackChain"
                className="h-10 w-10 rounded-md"
              />
              <div>
                <p className="font-title text-lg leading-none">HackChain</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <SidebarLink key={item.to} item={item} />
              ))}
            </nav>

            <div className="pt-4 border-t border-border/60 space-y-2">
              <LanguageToggle />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
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

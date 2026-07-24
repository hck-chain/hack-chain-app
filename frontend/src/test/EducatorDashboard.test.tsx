import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const searchParams = new URLSearchParams();

vi.mock('react-router-dom', () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
  useSearchParams: () => [searchParams, vi.fn()],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'es' },
  }),
}));

vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/LanguageToggle', () => ({
  LanguageToggle: () => null,
}));

vi.mock('@/components/CertificateCard/CertificateCard', () => ({
  default: () => <div data-testid="certificate-card" />,
}));

vi.mock('@/components/dashboard/ReferralsSection', () => ({
  ReferralsSection: () => null,
}));

vi.mock('@/components/DeleteAccountModal/DeleteAccountModal', () => ({
  DeleteAccountModal: () => null,
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: ReactNode }) => <>{children}</>,
  PopoverContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  PopoverTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ disabled }: { children: ReactNode; disabled?: boolean }) => (
    <button type="button" role="combobox" disabled={disabled} />
  ),
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectTrigger: ({ disabled, children }: { disabled?: boolean; children: ReactNode }) => (
    <button type="button" role="combobox" disabled={disabled}>{children}</button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <>{placeholder}</>,
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: ReactNode }) => <>{children}</>,
  AlertDialogAction: ({ children }: { children: ReactNode }) => <button>{children}</button>,
  AlertDialogCancel: ({ children }: { children: ReactNode }) => <button>{children}</button>,
  AlertDialogContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  AlertDialogDescription: ({ children }: { children: ReactNode }) => <>{children}</>,
  AlertDialogFooter: ({ children }: { children: ReactNode }) => <>{children}</>,
  AlertDialogHeader: ({ children }: { children: ReactNode }) => <>{children}</>,
  AlertDialogTitle: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/hooks/useCreateCertificate', () => ({
  useCreateCertificate: () => ({
    reserveCertificate: vi.fn(),
    createCertificate: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('@/hooks/usePendingClassRequestsCount', () => ({
  usePendingClassRequestsCount: () => ({ data: { count: 0 } }),
}));

vi.mock('@/hooks/useEducatorClassRequests', () => ({
  useEducatorClassRequests: () => ({ data: [], isPending: false }),
}));

vi.mock('@/hooks/useAdminAccess', () => ({
  useAdminAccess: () => ({ isAdmin: false }),
}));

vi.mock('@/hooks/useDeleteAccount', () => ({
  useDeleteAccount: () => ({ isPending: false, mutate: vi.fn() }),
}));

vi.mock('@/hooks/useSessionTimeout', () => ({
  useSessionTimeout: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ logout: vi.fn() }),
}));

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn((path: string) => {
      if (path === '/api/issuers/me') {
        return Promise.resolve({
          organization_name: 'Hack School',
          wallet_address: '0xeducator',
          email: 'educator@example.com',
          email_verified: true,
          photo_url: null,
        });
      }

      return Promise.resolve({ students: [] });
    }),
  },
}));

vi.mock('@/utils/web3Service', () => ({
  getCertificatesByEducator: vi.fn().mockResolvedValue(0),
}));

vi.mock('@/config/walletConfig', () => ({
  appKit: { disconnect: vi.fn() },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: new Proxy({}, {
    get: () => ({ children, ...props }: { children?: ReactNode }) => <div {...props}>{children}</div>,
  }),
}));

vi.mock('lucide-react', () => {
  const Icon = () => null;
  return {
    LogOut: Icon,
    ChevronDown: Icon,
    Mail: Icon,
    Briefcase: Icon,
    Wallet: Icon,
    FileText: Icon,
    Trash2: Icon,
    UserPen: Icon,
    Copy: Icon,
    Check: Icon,
    Users: Icon,
    BadgeCheck: Icon,
    Bell: Icon,
    User: Icon,
  };
});

import EducatorDashboard from '@/pages/EducatorDashboard';

function renderDashboard(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <EducatorDashboard />
    </QueryClientProvider>,
  );
}

describe('EducatorDashboard: certificado de clase completada', () => {
  it('prellena el formulario y bloquea los campos controlados por la clase', async () => {
    searchParams.set('classRequestId', '42');
    searchParams.set('studentWallet', '0xstudent');
    searchParams.set('studentName', 'Ana Lopez');
    searchParams.set('className', 'Solidity Avanzado');
    searchParams.set('classDate', '2026-07-21');

    renderDashboard('/educator');

    await waitFor(() => {
      expect(screen.getByDisplayValue('Solidity Avanzado')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('2026-07-21')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Clase Personalizada')).toBeInTheDocument();
    expect(screen.getByText(/0xstudent/)).toBeInTheDocument();

    expect(screen.getByLabelText('educatorDashboard.fieldCertTitle')).toHaveAttribute('readonly');
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByLabelText('educatorDashboard.fieldDate')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('educatorDashboard.fieldType')).toHaveAttribute('readonly');
  });
});
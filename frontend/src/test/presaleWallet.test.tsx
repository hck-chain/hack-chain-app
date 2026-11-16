/**
 * Tests de src/hooks/usePresaleWallet.ts y WalletGate.
 *
 * Regresión concreta: `isBusy` salía de `isLoading` de useWalletLogin, que es
 * `phase !== 'idle'`. Tras conectar, la fase queda en 'awaiting-signature', o
 * sea que el botón se marcaba ocupado y deshabilitado justo cuando tenía que
 * decir "Firmar para continuar" — el flujo se trababa en "Esperando a tu
 * cartera…" y no había forma de avanzar.
 *
 * Segundo caso: useWalletLogin no devuelve `phase` a 'idle' al terminar bien
 * (en /login da igual, navega y se desmonta). Como /presale sigue montada,
 * `isSigning` quedaba en true para siempre después de un login correcto.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { usePresaleWallet, type PresaleWallet } from '@/hooks/usePresaleWallet';
import WalletGate from '@/components/presale/WalletGate';

const walletLogin = {
  connect: vi.fn(),
  signAndLogin: vi.fn(),
  reset: vi.fn(),
  walletAddress: null as string | null,
  isAwaitingSignature: false,
  isConnecting: false,
  isSigning: false,
  error: undefined as string | undefined,
  isWalletNotFound: false,
};

const logout = vi.fn();
const auth = {
  user: null as { walletAddress: string | null } | null,
  isAuthenticated: false,
  logout,
};

vi.mock('@/hooks/useWalletLogin', () => ({
  useWalletLogin: () => walletLogin,
}));

// Provider EIP-1193 simulado: `cuentas` es lo que la cartera dice exponer.
// Con MetaMask bloqueada, eth_accounts devuelve [].
const provider = {
  cuentas: [] as string[],
  request: vi.fn(async () => provider.cuentas),
  on: vi.fn(),
  removeListener: vi.fn(),
};
vi.mock('@/config/walletConfig', () => ({
  appKit: { getProvider: () => provider },
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => auth,
}));
// El monorepo tiene React 19 en la raiz y el front usa React 18. lucide-react
// y react-router-dom solo existen arriba, asi que crean elementos con la React
// equivocada y react-dom los rechaza. Mismo mock que usan RecruiterVacancies,
// TalentProfile, EducatorDashboard, JobPrimitives y EditTalentProfile.
vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>{children}</a>
  ),
}));
vi.mock('lucide-react', () => ({
  Wallet: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="wallet-icon" {...props} />,
  PenLine: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="pen-icon" {...props} />,
  AlertCircle: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="alert-icon" {...props} />,
  Loader2: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="loader-icon" {...props} />,
}));

beforeEach(() => {
  // Los mocks son compartidos entre casos: sin limpiarlos, las llamadas de un
  // test se cuentan en el siguiente.
  vi.clearAllMocks();
  provider.cuentas = [];
  provider.request.mockImplementation(async () => provider.cuentas);
  Object.assign(walletLogin, {
    walletAddress: null, isAwaitingSignature: false, isConnecting: false,
    isSigning: false, error: undefined, isWalletNotFound: false,
  });
  Object.assign(auth, { user: null, isAuthenticated: false });
});

// Los casos de "cartera fantasma" (bloqueada, cambiada o desconectada antes
// de firmar) viven ahora en useWalletLogin.test.tsx: el comportamiento se
// movio al hook compartido para que /login lo herede tambien.
describe('usePresaleWallet — isBusy', () => {
  it('sin empezar nada, no está ocupada', () => {
    const { result } = renderHook(() => usePresaleWallet());

    expect(result.current.isBusy).toBe(false);
    expect(result.current.needsSignature).toBe(false);
  });

  it('con el modal abierto, está ocupada', () => {
    walletLogin.isConnecting = true;
    const { result } = renderHook(() => usePresaleWallet());

    expect(result.current.isBusy).toBe(true);
  });

  it('esperando la firma NO está ocupada — el botón tiene que poder pulsarse', () => {
    walletLogin.isAwaitingSignature = true;
    walletLogin.walletAddress = '0xabc';
    const { result } = renderHook(() => usePresaleWallet());

    expect(result.current.isBusy).toBe(false);
    expect(result.current.needsSignature).toBe(true);
  });

  it('mientras firma, está ocupada', () => {
    walletLogin.isSigning = true;
    const { result } = renderHook(() => usePresaleWallet());

    expect(result.current.isBusy).toBe(true);
  });

  it('una vez autenticada deja de estar ocupada aunque isSigning siga colgado', () => {
    walletLogin.isSigning = true;
    auth.isAuthenticated = true;
    auth.user = { walletAddress: '0xabc' };
    const { result } = renderHook(() => usePresaleWallet());

    expect(result.current.isBusy).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.needsSignature).toBe(false);
  });
});

const renderGate = (wallet: PresaleWallet) =>
  render(
    <WalletGate wallet={wallet} message="Conectá tu cartera.">
      <p>contenido protegido</p>
    </WalletGate>,
  );

describe('usePresaleWallet — cambio de cuenta con sesión abierta', () => {
  // El backend asigna los HACK a la wallet de la SESIÓN. Si el comprador se
  // pasa a otra cuenta y sube un comprobante, los tokens quedarían a nombre
  // de la anterior sin ningún aviso.
  const conSesion = (addr = '0xabc') => {
    auth.isAuthenticated = true;
    auth.user = { walletAddress: addr };
  };

  it('cierra sesión si la cartera pasa a otra cuenta', async () => {
    conSesion();
    provider.cuentas = ['0xDEF'];

    renderHook(() => usePresaleWallet());

    await waitFor(() => expect(logout).toHaveBeenCalled());
  });

  it('NO cierra sesión si la cartera se bloquea (lista vacía)', async () => {
    conSesion();
    provider.cuentas = []; // MetaMask bloqueada

    renderHook(() => usePresaleWallet());

    await waitFor(() => expect(provider.request).toHaveBeenCalled());
    expect(logout).not.toHaveBeenCalled();
  });

  it('NO cierra sesión si sigue en la misma cuenta', async () => {
    conSesion();
    provider.cuentas = ['0xABC'];

    renderHook(() => usePresaleWallet());

    await waitFor(() => expect(provider.request).toHaveBeenCalled());
    expect(logout).not.toHaveBeenCalled();
  });

  it('reacciona al evento accountsChanged de MetaMask', async () => {
    conSesion();
    provider.cuentas = ['0xABC'];

    renderHook(() => usePresaleWallet());
    await waitFor(() => expect(provider.request).toHaveBeenCalled());
    expect(logout).not.toHaveBeenCalled();

    // MetaMask siempre emite este evento al cambiar de cuenta.
    const handler = provider.on.mock.calls.find((c) => c[0] === 'accountsChanged')?.[1];
    handler(['0xDEF']);

    expect(logout).toHaveBeenCalled();
  });

  it('un bloqueo notificado por accountsChanged tampoco cierra sesión', async () => {
    conSesion();
    provider.cuentas = ['0xABC'];

    renderHook(() => usePresaleWallet());
    await waitFor(() => expect(provider.request).toHaveBeenCalled());

    const handler = provider.on.mock.calls.find((c) => c[0] === 'accountsChanged')?.[1];
    handler([]);

    expect(logout).not.toHaveBeenCalled();
  });
});

describe('WalletGate', () => {
  it('esperando la firma ofrece un botón de firmar habilitado', () => {
    walletLogin.isAwaitingSignature = true;
    walletLogin.walletAddress = '0xabcdef0123456789abcdef0123456789abcdef01';
    const { result } = renderHook(() => usePresaleWallet());

    renderGate(result.current);

    const boton = screen.getByRole('button', { name: /Firmar para continuar/i });
    expect(boton).toBeEnabled();
    expect(screen.queryByText(/Esperando a tu cartera/i)).not.toBeInTheDocument();
    expect(screen.queryByText('contenido protegido')).not.toBeInTheDocument();
  });

  it('sin cartera ofrece conectar', () => {
    const { result } = renderHook(() => usePresaleWallet());

    renderGate(result.current);

    expect(screen.getByRole('button', { name: /Conectar cartera digital/i })).toBeEnabled();
  });

  it('autenticada deja pasar el contenido', () => {
    auth.isAuthenticated = true;
    auth.user = { walletAddress: '0xabc' };
    const { result } = renderHook(() => usePresaleWallet());

    renderGate(result.current);

    expect(screen.getByText('contenido protegido')).toBeInTheDocument();
  });

  it('una cartera sin cuenta manda a registrarse', () => {
    walletLogin.isWalletNotFound = true;
    const { result } = renderHook(() => usePresaleWallet());

    renderGate(result.current);

    expect(screen.getByRole('link', { name: /Crear una cuenta/i })).toHaveAttribute('href', '/register');
  });
});

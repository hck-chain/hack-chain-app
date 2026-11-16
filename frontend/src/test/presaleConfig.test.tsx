/**
 * La direccion de pago vive en un solo lugar (backend/config/presale.js).
 * - VerificationStrip la muestra desde el backend, y si no esta definida no
 *   muestra ninguna (mejor nada que una equivocada).
 * - PresaleConfigPanel la muestra al admin para analizarla, con lo pendiente
 *   y lo sobrescrito.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import VerificationStrip from '@/components/presale/VerificationStrip';
import PresaleConfigPanel from '@/components/admin/PresaleConfigPanel';

vi.mock('lucide-react', () => {
  const Icon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />;
  return { Copy: Icon, Check: Icon, ShieldAlert: Icon, Loader2: Icon, AlertTriangle: Icon, ExternalLink: Icon };
});
const presale = vi.hoisted(() => ({ getConfig: vi.fn() }));
vi.mock('@/services/presale', () => ({ presaleService: presale }));
const admin = vi.hoisted(() => ({ getPresaleConfig: vi.fn() }));
vi.mock('@/services/admin', () => ({ adminApi: admin }));

const TREASURY = '0x' + '77'.repeat(20);
const publicConfig = (treasury: string | null) => ({
  payment: { network: 'Ethereum', chainId: 1, explorer: 'https://etherscan.io', treasury,
    token: { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 } },
  token: { network: 'Polygon', chainId: 137, explorer: 'https://polygonscan.com', presaleContract: null },
  minPurchaseUsdt: 1,
  phases: [],
});

const wrap = (ui: React.ReactNode) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

beforeEach(() => vi.clearAllMocks());

describe('VerificationStrip — dirección de pago desde el backend', () => {
  it('muestra la tesorería publicada y la red Ethereum', async () => {
    presale.getConfig.mockResolvedValue(publicConfig(TREASURY));
    wrap(<VerificationStrip />);
    expect(await screen.findByText(TREASURY)).toBeInTheDocument();
    expect(screen.getByText(/Red requerida: Ethereum · USDT/)).toBeInTheDocument();
  });

  it('sin tesorería definida no muestra ninguna dirección ni deja copiar', async () => {
    presale.getConfig.mockResolvedValue(publicConfig(null));
    wrap(<VerificationStrip />);
    expect(await screen.findByText(/todavía no fue publicada/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Copiar dirección/i })).not.toBeInTheDocument();
  });

  it('si el backend no responde, tampoco inventa una dirección', async () => {
    presale.getConfig.mockRejectedValue(new Error('caído'));
    wrap(<VerificationStrip />);
    expect(await screen.findByText(/No pudimos cargar la dirección oficial/i, {}, { timeout: 4000 })).toBeInTheDocument();
  });
});

describe('PresaleConfigPanel — para que el encargado analice', () => {
  const adminConfig = {
    networks: [
      { role: 'payment', description: 'Donde el comprador manda el USDT', network: 'Ethereum', chainId: 1,
        explorer: 'https://etherscan.io', treasury: TREASURY,
        token: { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }, rpcEnv: 'X' },
      { role: 'token', description: 'Donde vive HACK', network: 'Polygon', chainId: 137,
        explorer: 'https://polygonscan.com', multisig: null, presaleContract: null, rpcEnv: 'Y' },
    ],
    overrides: [{ role: 'payment', field: 'treasury', env: 'PRESALE_TREASURY_ADDRESS', fileValue: null, value: TREASURY }],
    pending: [{ role: 'token', field: 'multisig' }, { role: 'token', field: 'presaleContract' }],
    phases: [{ id: 1, label: 'Primera', priceUsdt: '0.00003', start: '2026-12-08T00:00:00Z', end: '2026-12-14T23:59:59Z',
      capHack: '20000000', soldHack: '1500000', availableHack: '18500000' }],
    phasesOverridden: false,
  };

  it('muestra dónde queda cada cosa, con enlace al explorador', async () => {
    admin.getPresaleConfig.mockResolvedValue(adminConfig);
    wrap(<PresaleConfigPanel />);
    const link = await screen.findByRole('link', { name: new RegExp(TREASURY) });
    expect(link).toHaveAttribute('href', `https://etherscan.io/address/${TREASURY}`);
    expect(screen.getAllByText('Pendiente de definir')).toHaveLength(2);
  });

  it('avisa los valores sobrescritos por variables de entorno', async () => {
    admin.getPresaleConfig.mockResolvedValue(adminConfig);
    wrap(<PresaleConfigPanel />);
    expect(await screen.findByText(/Hay valores sobrescritos/i)).toBeInTheDocument();
    expect(screen.getByText(/Sobrescrita por PRESALE_TREASURY_ADDRESS/)).toBeInTheDocument();
  });

  it('muestra cada fase con lo vendido y lo disponible', async () => {
    admin.getPresaleConfig.mockResolvedValue(adminConfig);
    wrap(<PresaleConfigPanel />);
    expect(await screen.findByText('1.500.000')).toBeInTheDocument();
    expect(screen.getByText('18.500.000')).toBeInTheDocument();
  });
});

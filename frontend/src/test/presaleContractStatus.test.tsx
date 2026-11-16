/**
 * Tests de src/components/admin/PresaleContractStatus.tsx
 *
 * El caso que no puede pasar desapercibido es la doble carga: el contrato
 * suma las asignaciones, asi que una tanda cargada dos veces entrega el
 * doble. Tiene que verse en rojo y nombrar las wallets.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PresaleContractStatus from '@/components/admin/PresaleContractStatus';

vi.mock('lucide-react', () => {
  const Icon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />;
  return {
    CheckCircle2: Icon, XCircle: Icon, Circle: Icon, AlertTriangle: Icon,
    Loader2: Icon, RefreshCw: Icon, ExternalLink: Icon,
  };
});
vi.mock('@/components/ui/button', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Button: ({ children, variant, size, asChild, ...p }: any) => <button {...p}>{children}</button>,
}));
const api = vi.hoisted(() => ({ getPresaleContractStatus: vi.fn() }));
vi.mock('@/services/admin', () => ({ adminApi: api }));

const W = (n: number) => '0x' + String(n).repeat(40).slice(0, 40);

function status(over: Record<string, unknown> = {}) {
  return {
    configured: true,
    contract: '0x' + 'c0'.repeat(20),
    review: { pending: 0 },
    onchain: {
      totalAllocated: '0', totalAllocatedHack: '0', totalClaimedHack: '0', beneficiaryCount: 0,
      presaleCapHack: '100000000', balanceHack: '100000000', allocationListHash: null,
      finalized: false, paused: false, vestingStart: null, claimFrom: null,
    },
    funding: { state: 'ok' },
    batch: {
      hash: '0x' + '98'.repeat(32), wallets: 3, hack: '6000000', batchSize: 200,
      batches: [{ index: 1, wallets: 3, state: 'not_loaded', loadedWallets: 0 }],
      problems: [],
    },
    checks: { totals: 'below', unknownBeneficiaries: 0, hash: 'unset' },
    ...over,
  };
}

const renderIt = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PresaleContractStatus />
    </QueryClientProvider>,
  );

const tono = (texto: RegExp) => screen.getByText(texto).closest('li')?.getAttribute('data-tone');

beforeEach(() => vi.clearAllMocks());

describe('PresaleContractStatus', () => {
  it('sin contrato desplegado lo explica, sin errores', async () => {
    api.getPresaleContractStatus.mockResolvedValue({ configured: false, detail: 'PRESALE_CONTRACT_ADDRESS no esta configurada' });
    renderIt();
    expect(await screen.findByText(/todavía no está configurado/i)).toBeInTheDocument();
  });

  it('antes de cargar: los pasos quedan pendientes, no en error', async () => {
    api.getPresaleContractStatus.mockResolvedValue(status());
    renderIt();
    await screen.findByText(/Carga del lote: 0 de 1 tanda/);
    expect(tono(/Revisión completa/)).toBe('ok');
    expect(tono(/Carga del lote/)).toBe('todo');
    expect(tono(/Hash del lote sin grabar/)).toBe('todo');
    expect(tono(/Preventa abierta/)).toBe('todo');
  });

  it('todo cargado, hash coincide y finalizada: todo en verde con la fecha de reclamo', async () => {
    api.getPresaleContractStatus.mockResolvedValue(status({
      onchain: {
        ...status().onchain, totalAllocatedHack: '6000000', allocationListHash: '0x' + '98'.repeat(32),
        finalized: true, vestingStart: '2026-12-29T00:00:00.000Z', claimFrom: '2027-01-28T00:00:00.000Z',
      },
      batch: { ...status().batch, batches: [{ index: 1, wallets: 3, state: 'loaded', loadedWallets: 3 }] },
      checks: { totals: 'match', unknownBeneficiaries: 0, hash: 'match' },
    }));
    renderIt();
    await screen.findByText(/Carga del lote: 1 de 1 tanda/);
    expect(tono(/Carga del lote/)).toBe('ok');
    expect(tono(/coincide con el lote/)).toBe('ok');
    expect(tono(/Preventa finalizada/)).toBe('ok');
    // Instante del bloque mostrado en hora local: se calcula igual que el
    // componente para que el test no dependa de la zona horaria de la maquina.
    const esperado = new Date('2027-01-28T00:00:00.000Z').toLocaleString('es-AR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    expect(screen.getByText(new RegExp(`pueden reclamar desde el ${esperado}`))).toBeInTheDocument();
  });

  it('DOBLE CARGA: en rojo, explica la causa probable y nombra cada wallet', async () => {
    api.getPresaleContractStatus.mockResolvedValue(status({
      onchain: { ...status().onchain, totalAllocatedHack: '9000000' },
      batch: {
        ...status().batch,
        batches: [{ index: 1, wallets: 3, state: 'over', loadedWallets: 0 }],
        problems: [{ address: W(3), state: 'over', expectedHack: '3000000', onchainHack: '6000000' }],
      },
      checks: { totals: 'above', unknownBeneficiaries: 0, hash: 'unset' },
    }));
    renderIt();
    expect(await screen.findByText(/Probablemente una tanda se cargó dos veces/)).toBeInTheDocument();
    expect(screen.getByText(/1 tanda\(s\) cargada\(s\) de más/)).toBeInTheDocument();
    expect(screen.queryByText(/0 de 1 tanda/)).not.toBeInTheDocument();
    expect(tono(/cargada\(s\) de más/)).toBe('error');
    expect(screen.getByText(/el contrato tiene MÁS que el lote/)).toBeInTheDocument();
    expect(screen.getByText(/Tanda 1 · cargada de más/)).toBeInTheDocument();
    expect(screen.getByText(/le corresponden 3.000.000/)).toBeInTheDocument();
  });

  it('hash grabado distinto: en rojo', async () => {
    api.getPresaleContractStatus.mockResolvedValue(status({
      onchain: { ...status().onchain, allocationListHash: '0x' + 'ab'.repeat(32) },
      checks: { totals: 'below', unknownBeneficiaries: 0, hash: 'mismatch' },
    }));
    renderIt();
    expect(await screen.findByText(/NO coincide con el lote actual/)).toBeInTheDocument();
    expect(tono(/NO coincide/)).toBe('error');
  });

  it('sin fondos suficientes: dice cuántos HACK faltan', async () => {
    api.getPresaleContractStatus.mockResolvedValue(status({ funding: { state: 'short', missingHack: '13000000' } }));
    renderIt();
    expect(await screen.findByText(/Faltan 13.000.000 HACK en el contrato/)).toBeInTheDocument();
  });

  it('con pendientes lo marca como advertencia', async () => {
    api.getPresaleContractStatus.mockResolvedValue(status({ review: { pending: 2 } }));
    renderIt();
    await screen.findByText(/Faltan revisar 2 aporte/);
    expect(tono(/Faltan revisar/)).toBe('warn');
  });
});

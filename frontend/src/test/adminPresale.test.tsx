/**
 * Tests de src/pages/admin/AdminPresalePage.tsx
 *
 * Lo que no puede fallar en esta pantalla: que "Validar" quede bloqueado si
 * la transferencia no se verifica en Polygon, que rechazar exija un motivo
 * (lo ve el comprador), y que si la exportacion se niega, el admin vea que
 * aporte la freno y por que.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminPresalePage from '@/pages/admin/AdminPresalePage';
import { ApiServiceError } from '@/services/api';

// React 19 en la raiz del monorepo y 18 en el front: lucide y
// @radix-ui/react-slot viven arriba y crean elementos con la React
// equivocada. Misma convencion que el resto de los tests del repo: se
// mockean los iconos y las primitivas de UI con HTML plano.
vi.mock('lucide-react', () => {
  const Icon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />;
  return {
    CheckCircle2: Icon, XCircle: Icon, Loader2: Icon, ExternalLink: Icon,
    Download: Icon, Copy: Icon, AlertTriangle: Icon, X: Icon, Circle: Icon, RefreshCw: Icon,
  };
});
vi.mock('@/components/ui/button', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Button: ({ children, variant, size, asChild, ...p }: any) => <button {...p}>{children}</button>,
}));
vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...p }: any) => <label {...p}>{children}</label>,
}));
vi.mock('@/components/ui/dialog', () => {
  const Pass = ({ children }: any) => <div>{children}</div>;
  return {
    Dialog: ({ open, children }: any) => (open ? <div role="dialog">{children}</div> : null),
    DialogContent: Pass, DialogHeader: Pass, DialogFooter: Pass,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
  };
});
vi.mock('@/components/ui/tabs', async () => {
  const React = await import('react');
  const Ctx = React.createContext<(v: string) => void>(() => {});
  return {
    Tabs: ({ onValueChange, children }: any) => <Ctx.Provider value={onValueChange}>{children}</Ctx.Provider>,
    TabsList: ({ children }: any) => <div role="tablist">{children}</div>,
    TabsTrigger: ({ value, children }: any) => {
      const set = React.useContext(Ctx);
      return <button role="tab" onClick={() => set(value)}>{children}</button>;
    },
  };
});

const api = vi.hoisted(() => ({
  listPresaleContributions: vi.fn(),
  verifyPresaleContribution: vi.fn(),
  validatePresaleContribution: vi.fn(),
  rejectPresaleContribution: vi.fn(),
  exportPresaleBatch: vi.fn(),
  getPresaleContractStatus: vi.fn(),
}));
vi.mock('@/services/admin', () => ({ adminApi: api }));

const ROW = {
  id: 7,
  wallet_address: '0x' + 'aa'.repeat(20),
  phase_id: 1,
  usdt_amount: '30.000000',
  hack_amount: '1000000',
  tx_hash: '0x' + 'ab'.repeat(32),
  proof_cid: null,
  proof_uri: null,
  status: 'pending' as const,
  rejection_reason: null,
  validated_at: null,
  reviewed_by: null,
  reviewed_at: null,
  onchain_amount_usdt: null,
  created_at: '2026-12-09T10:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  api.getPresaleContractStatus.mockResolvedValue({ configured: false, detail: 'sin contrato' });
  api.listPresaleContributions.mockResolvedValue({
    contributions: [ROW], page: 1, per_page: 25, total: 1, total_pages: 1,
    counts: { pending: 1, validated: 3, rejected: 0 },
  });
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AdminPresalePage />
    </QueryClientProvider>,
  );

async function abrirRevision(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Revisar' }));
  return screen.findByRole('dialog');
}

describe('AdminPresalePage — revisión', () => {
  it('con el pago verificado, deja validar', async () => {
    api.verifyPresaleContribution.mockResolvedValue({ verification: { ok: true, amountUsdt: 30, txHash: ROW.tx_hash } });
    api.validatePresaleContribution.mockResolvedValue({ contribution: { ...ROW, status: 'validated' } });
    const user = userEvent.setup();
    renderPage();

    const dialog = await abrirRevision(user);
    await within(dialog).findByText(/Pago verificado en Polygon/i);
    await user.click(within(dialog).getByRole('button', { name: 'Validar' }));

    await waitFor(() => expect(api.validatePresaleContribution).toHaveBeenCalledWith(7));
  });

  it('si el pago salió de otra wallet, lo explica y NO deja validar', async () => {
    api.verifyPresaleContribution.mockResolvedValue({ verification: { ok: false, reason: 'WRONG_SENDER' } });
    const user = userEvent.setup();
    renderPage();

    const dialog = await abrirRevision(user);
    await within(dialog).findByText(/Puede ser un hash ajeno/i);

    expect(within(dialog).getByRole('button', { name: 'Validar' })).toBeDisabled();
  });

  it('mientras verifica, Validar está bloqueado', async () => {
    api.verifyPresaleContribution.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderPage();

    const dialog = await abrirRevision(user);
    await within(dialog).findByText(/Verificando en Polygon/i);

    expect(within(dialog).getByRole('button', { name: 'Validar' })).toBeDisabled();
  });

  it('rechazar exige un motivo antes de confirmar', async () => {
    api.verifyPresaleContribution.mockResolvedValue({ verification: { ok: false, reason: 'TX_NOT_FOUND' } });
    api.rejectPresaleContribution.mockResolvedValue({ contribution: { ...ROW, status: 'rejected' } });
    const user = userEvent.setup();
    renderPage();

    const dialog = await abrirRevision(user);
    await user.click(within(dialog).getByRole('button', { name: 'Rechazar' }));
    const confirmar = within(dialog).getByRole('button', { name: 'Confirmar rechazo' });
    expect(confirmar).toBeDisabled();

    await user.type(within(dialog).getByLabelText(/Motivo del rechazo/i), 'La transacción no existe.');
    expect(confirmar).toBeEnabled();
    await user.click(confirmar);

    await waitFor(() =>
      expect(api.rejectPresaleContribution).toHaveBeenCalledWith(7, 'La transacción no existe.'),
    );
  });

  it('muestra los contadores por estado en las pestañas', async () => {
    renderPage();
    // La pestaña existe antes de que lleguen los datos (con 0): hay que esperar al contador.
    await waitFor(() => expect(screen.getByRole('tab', { name: /Validados/ })).toHaveTextContent('3'));
    expect(screen.getByRole('tab', { name: /Pendientes/ })).toHaveTextContent('1');
  });
});

describe('AdminPresalePage — exportación', () => {
  // Por defecto, cola de pendientes vacia: es la unica situacion en la que
  // se puede generar el lote.
  beforeEach(() => {
    api.listPresaleContributions.mockResolvedValue({
      contributions: [], page: 1, per_page: 25, total: 0, total_pages: 1,
      counts: { pending: 0, validated: 3, rejected: 0 },
    });
  });

  it('con aportes pendientes NO deja generar el lote y explica por qué', async () => {
    api.listPresaleContributions.mockResolvedValue({
      contributions: [ROW], page: 1, per_page: 25, total: 1, total_pages: 1,
      counts: { pending: 3, validated: 1, rejected: 0 },
    });
    renderPage();

    expect(await screen.findByText(/Hay 3 aportes pendientes de revisión/i)).toBeInTheDocument();
    expect(screen.getByText(/se queda sin tokens/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generar lote' })).toBeDisabled();
  });

  it('con varias tandas ofrece descargar cada una', async () => {
    api.exportPresaleBatch.mockResolvedValue({
      ok: true, csv: 'a\nb\nc\n', hash: '0x' + '11'.repeat(32), rows: [],
      totals: { wallets: 3, contributions: 3, hack: '3', wei: '3' },
      batchSize: 200,
      batches: [
        { index: 1, wallets: 200, csv: 'a\nb\n' },
        { index: 2, wallets: 1, csv: 'c\n' },
      ],
    });
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Generar lote' })).toBeEnabled());

    await user.click(screen.getByRole('button', { name: 'Generar lote' }));

    expect(await screen.findByRole('button', { name: /Tanda 1 \(200\)/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tanda 2 \(1\)/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lote completo/ })).toBeInTheDocument();
  });

  it('si una fila no se sostiene en cadena, muestra cuál y por qué, y no ofrece descargar', async () => {
    api.exportPresaleBatch.mockRejectedValue(
      new ApiServiceError('VERIFICATION_FAILED', 422, {
        error: 'VERIFICATION_FAILED',
        problems: [{ id: 12, wallet_address: '0x' + 'cc'.repeat(20), tx_hash: null, reason: 'TX_NOT_FOUND' }],
      }),
    );
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Generar lote' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Generar lote' }));

    expect(await screen.findByText(/No se exportó/i)).toBeInTheDocument();
    expect(screen.getByText(/#12/)).toBeInTheDocument();
    expect(screen.getByText(/no existe en Polygon/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Lote completo/i })).not.toBeInTheDocument();
  });

  it('con el lote generado muestra el hash y permite descargar', async () => {
    api.exportPresaleBatch.mockResolvedValue({
      ok: true,
      csv: '0xaa,1\n',
      hash: '0x' + '98'.repeat(32),
      rows: [],
      totals: { wallets: 2, contributions: 3, hack: '1750000', wei: '1' },
      batchSize: 200,
      batches: [{ index: 1, wallets: 2, csv: '0xaa,1\n' }],
    });
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Generar lote' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Generar lote' }));

    expect(await screen.findByText('0x' + '98'.repeat(32))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lote completo/i })).toBeInTheDocument();
    expect(screen.getByText(/Entra en una sola tanda/i)).toBeInTheDocument();
  });

  it('sin aportes validados no deja generar', async () => {
    api.listPresaleContributions.mockResolvedValue({
      contributions: [], page: 1, per_page: 25, total: 0, total_pages: 1,
      counts: { pending: 0, validated: 0, rejected: 0 },
    });
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Generar lote' })).toBeDisabled());
  });
});

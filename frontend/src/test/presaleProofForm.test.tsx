/**
 * Tests de src/components/presale/PurchaseProofForm.tsx
 *
 * Regla del encargado: la fuente de verdad son las transferencias en cadena,
 * asi que el hash es obligatorio y la captura es solo respaldo.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PurchaseProofForm from '@/components/presale/PurchaseProofForm';
import type { Phase } from '@/types/presale';

// React 19 en la raiz del monorepo vs 18 en el front: lucide crea elementos
// con la React equivocada (mismo mock que el resto de los tests).
vi.mock('lucide-react', () => {
  const Icon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />;
  return { Upload: Icon, Check: Icon, Loader2: Icon, AlertCircle: Icon, FileText: Icon };
});
vi.mock('@/services/presale', () => ({
  presaleService: { uploadProof: vi.fn(), register: vi.fn() },
}));

const PHASE: Phase = {
  id: 1, label: 'Primera',
  start: new Date('2026-12-08T00:00:00Z'), end: new Date('2026-12-14T23:59:59Z'),
  price: 0.00003, tokensAvailable: 20_000_000, maxPerPurchase: 5_000_000,
  lockup: '1 mes', release: '33.3% mensual (3 meses)',
};
const HASH = '0x' + 'ab'.repeat(32);

const renderForm = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PurchaseProofForm activePhase={PHASE} />
    </QueryClientProvider>,
  );

const enviar = () => screen.getByRole('button', { name: /Enviar comprobante/i });
const monto = () => screen.getByLabelText(/Cuántos USDT transferiste/i);
const hash = () => screen.getByLabelText(/Hash o enlace de la transacción/i);

describe('PurchaseProofForm — hash obligatorio', () => {
  it('con monto pero sin hash no deja enviar', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(monto(), '30');

    expect(enviar()).toBeDisabled();
    expect(screen.getByText(/Falta el hash de la transacción/i)).toBeInTheDocument();
  });

  it('con una captura pero sin hash sigue sin dejar enviar', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(monto(), '30');
    const archivo = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'c.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText(/Captura del comprobante/i), archivo);

    expect(enviar()).toBeDisabled();
  });

  it('con monto y hash deja enviar, sin captura', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(monto(), '30');
    await user.type(hash(), HASH);

    expect(enviar()).toBeEnabled();
  });

  it('acepta el hash pegado dentro de un enlace de Polygonscan', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(monto(), '30');
    await user.type(hash(), `https://polygonscan.com/tx/${HASH}`);

    expect(enviar()).toBeEnabled();
  });

  it('marca la captura como opcional', () => {
    renderForm();
    expect(screen.getByText(/\(opcional\)/i)).toBeInTheDocument();
  });
});

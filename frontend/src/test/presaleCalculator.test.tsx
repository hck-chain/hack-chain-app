/**
 * Tests de src/components/presale/Calculator.tsx
 *
 * El bug que cubre el primer bloque: los dos campos tenian estado propio, asi
 * que escribir en USDT dejaba el campo de HACK con el valor anterior y la
 * pantalla mostraba dos cifras que no se correspondian entre si.
 *
 * No se puede verificar en el navegador porque las fechas configuradas en
 * PHASES ya pasaron y getActivePhase() devuelve null, asi que la fase se
 * inyecta por props.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Calculator from '@/components/presale/Calculator';
import type { Phase } from '@/types/presale';

const PHASE: Phase = {
  id: 1,
  label: 'Primera',
  start: new Date('2026-08-30T00:00:00Z'),
  end: new Date('2026-09-05T23:59:59Z'),
  price: 0.00003,
  tokensAvailable: 20_000_000,
  maxPerPurchase: 5_000_000,
  lockup: '1 mes',
  release: '33.3% mensual (3 meses)',
};

const usdtField = () => screen.getByLabelText(/Tengo esta cantidad de USDT/i);
const hackField = () => screen.getByLabelText(/Quiero comprar esta cantidad de HACK/i);

describe('Calculator — sincronización de campos', () => {
  it('escribir en USDT completa el campo de HACK', async () => {
    const user = userEvent.setup();
    render(<Calculator activePhase={PHASE} />);

    await user.type(usdtField(), '30');

    // 30 / 0.00003 = 1.000.000
    expect(hackField()).toHaveValue(1_000_000);
  });

  it('escribir en HACK completa el campo de USDT', async () => {
    const user = userEvent.setup();
    render(<Calculator activePhase={PHASE} />);

    await user.type(hackField(), '1000000');

    expect(usdtField()).toHaveValue(30);
  });

  it('los dos campos nunca muestran una conversión inconsistente', async () => {
    const user = userEvent.setup();
    render(<Calculator activePhase={PHASE} />);

    await user.type(usdtField(), '30');
    await user.clear(hackField());
    await user.type(hackField(), '2000000');

    // Al pasar a editar HACK, el campo de USDT se recalcula: 2.000.000 * 0.00003
    expect(usdtField()).toHaveValue(60);
  });

  it('vaciar el campo editado vacía también el derivado', async () => {
    const user = userEvent.setup();
    render(<Calculator activePhase={PHASE} />);

    await user.type(usdtField(), '30');
    await user.clear(usdtField());

    expect(hackField()).toHaveValue(null);
  });
});

describe('Calculator — límites', () => {
  it('rechaza por debajo del mínimo de 1 USDT', async () => {
    const user = userEvent.setup();
    render(<Calculator activePhase={PHASE} />);

    await user.type(usdtField(), '0.5');

    expect(screen.getByText(/mínimo de compra es 1 USDT/i)).toBeInTheDocument();
  });

  it('rechaza por encima del máximo por compra de la fase', async () => {
    const user = userEvent.setup();
    render(<Calculator activePhase={PHASE} />);

    await user.type(hackField(), '6000000');

    expect(screen.getByText(/máximo por compra en esta fase/i)).toBeInTheDocument();
  });

  it('acepta el máximo exacto', async () => {
    const user = userEvent.setup();
    render(<Calculator activePhase={PHASE} />);

    await user.type(hackField(), '5000000');

    expect(screen.queryByText(/máximo por compra/i)).not.toBeInTheDocument();
    expect(screen.getByText(/150 USDT/)).toBeInTheDocument();
  });

  it('sin fase abierta no muestra la calculadora', () => {
    render(<Calculator activePhase={null} />);

    expect(screen.getByText(/vuelve a estar disponible en la próxima fase/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Tengo esta cantidad de USDT/i)).not.toBeInTheDocument();
  });
});

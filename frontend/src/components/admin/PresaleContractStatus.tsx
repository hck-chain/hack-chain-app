// frontend/src/components/admin/PresaleContractStatus.tsx
//
// "Estado en el contrato": lo que dice PresaleAllocation en Polygon,
// comparado contra el lote. Ordenado como el procedimiento de cierre, para
// que el encargado lo lea como una lista de pasos.
//
// Todo sale de leer el contrato (backend: GET /api/admin/presale/contract-status),
// nada de lo que alguien anoto. El error caro que tiene que saltar a la vista
// es la doble carga: el contrato suma las asignaciones, asi que una tanda
// cargada dos veces entrega el doble de tokens.

import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Circle, AlertTriangle, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminApi, PresaleBatchState } from '@/services/admin';

type Tone = 'ok' | 'todo' | 'warn' | 'error';

const fmt = (n: string | number) => new Intl.NumberFormat('es-ES').format(Number(n));
const short = (v: string) => `${v.slice(0, 10)}…${v.slice(-8)}`;
// Son instantes (timestamps de bloque), no fechas de calendario: se muestran
// en la hora local de quien mira, con hora, para que "desde el 27" no se
// confunda con "desde el 28" segun la zona.
const fecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

function ToneIcon({ tone }: { tone: Tone }) {
  if (tone === 'ok') return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />;
  if (tone === 'error') return <XCircle className="h-4 w-4 shrink-0 text-destructive" />;
  if (tone === 'warn') return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />;
  return <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

function Paso({ n, tone, titulo, children }: { n: number; tone: Tone; titulo: string; children?: ReactNode }) {
  return (
    <li className="flex gap-3" data-tone={tone}>
      <div className="mt-0.5"><ToneIcon tone={tone} /></div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium">
          <span className="mr-1.5 text-muted-foreground">{n}.</span>{titulo}
        </p>
        {children && <div className="text-sm text-muted-foreground">{children}</div>}
      </div>
    </li>
  );
}

const BATCH_LABEL: Record<PresaleBatchState, string> = {
  loaded: 'cargada',
  not_loaded: 'sin cargar',
  partial: 'parcial',
  over: 'cargada de más',
};
const BATCH_CLASS: Record<PresaleBatchState, string> = {
  loaded: 'border-emerald-500/30 bg-emerald-500/10',
  not_loaded: 'border-border/60',
  partial: 'border-amber-500/40 bg-amber-500/10',
  over: 'border-destructive/50 bg-destructive/15',
};

export default function PresaleContractStatus() {
  const q = useQuery({
    queryKey: ['admin', 'presale', 'contract-status'],
    queryFn: () => adminApi.getPresaleContractStatus(),
    retry: false,
    refetchInterval: 60_000,
  });

  const s = q.data;

  return (
    <div className="space-y-4 rounded-lg border border-border/50 bg-background/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-title text-lg">Estado en el contrato</h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            Lo que dice <code>PresaleAllocation</code> en Polygon, comparado contra el lote. Sólo
            lectura: no firma ni envía nada.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}>
          {q.isFetching
            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            : <RefreshCw className="mr-2 h-4 w-4" />}
          Actualizar
        </Button>
      </div>

      {q.isLoading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Leyendo el contrato…
        </p>
      )}

      {q.isError && (
        <p className="text-sm text-amber-500">
          No se pudo leer el contrato. Reintentá en un momento.
        </p>
      )}

      {s && !s.configured && (
        <div className="rounded-md border border-border/60 p-3 text-sm text-muted-foreground">
          El contrato todavía no está configurado ({s.detail}). Cuando esté desplegado, cargá su
          dirección en <code>PRESALE_CONTRACT_ADDRESS</code> del backend y acá vas a ver el avance
          de la carga del lote.
        </div>
      )}

      {s?.configured && s.onchain && (
        <>
          <p className="text-xs text-muted-foreground">
            Contrato{' '}
            <a
              href={`https://polygonscan.com/address/${s.contract}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono underline underline-offset-2"
            >
              {short(s.contract!)} <ExternalLink className="h-3 w-3" />
            </a>
            {s.onchain.paused && <span className="ml-2 font-medium text-amber-500">· PAUSADO</span>}
          </p>

          <ol className="space-y-4">
            <Paso
              n={1}
              tone={s.review!.pending === 0 ? 'ok' : 'warn'}
              titulo={s.review!.pending === 0
                ? 'Revisión completa: no quedan aportes pendientes'
                : `Faltan revisar ${s.review!.pending} aporte(s)`}
            />

            <Paso
              n={2}
              tone={s.funding!.state === 'ok' ? 'ok' : 'error'}
              titulo={s.funding!.state === 'ok'
                ? 'El contrato tiene fondos para pagar lo asignado'
                : `Faltan ${fmt(s.funding!.missingHack!)} HACK en el contrato`}
            >
              Saldo: {fmt(s.onchain.balanceHack)} HACK · Tope de la preventa: {fmt(s.onchain.presaleCapHack)} HACK
            </Paso>

            {!s.batch ? (
              <Paso n={3} tone="todo" titulo="Carga del lote">
                Todavía no hay aportes validados: no hay lote que comparar.
              </Paso>
            ) : (
              <Paso
                n={3}
                tone={s.batch.problems.some((p) => p.state === 'over') ? 'error'
                  : s.batch.problems.length ? 'warn'
                    : s.checks!.totals === 'match' ? 'ok' : 'todo'}
                titulo={
                  // Con una tanda cargada de mas, "0 de 1" sugeriria "falta
                  // cargar", que es lo contrario de lo que paso.
                  s.batch.batches.some((b) => b.state === 'over')
                    ? `Carga del lote: ${s.batch.batches.filter((b) => b.state === 'over').length} tanda(s) cargada(s) de más`
                    : `Carga del lote: ${s.batch.batches.filter((b) => b.state === 'loaded').length} de ${s.batch.batches.length} tanda(s)`
                }
              >
                <div className="space-y-2">
                  <p>
                    Asignado en el contrato: {fmt(s.onchain.totalAllocatedHack)} HACK · Lote: {fmt(s.batch.hack)} HACK
                    {s.checks!.totals === 'above' && (
                      <span className="font-medium text-destructive"> — el contrato tiene MÁS que el lote</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {s.batch.batches.map((b) => (
                      <span
                        key={b.index}
                        className={`rounded-md border px-2 py-1 text-xs text-foreground ${BATCH_CLASS[b.state]}`}
                        data-state={b.state}
                      >
                        Tanda {b.index} · {BATCH_LABEL[b.state]}
                        {b.state === 'partial' && ` (${b.loadedWallets}/${b.wallets})`}
                      </span>
                    ))}
                  </div>
                </div>
              </Paso>
            )}

            {s.batch && s.batch.problems.length > 0 && (
              <li className="space-y-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                <p className="font-medium text-foreground">
                  {s.batch.problems.some((p) => p.state === 'over')
                    ? 'Hay wallets con MÁS tokens de los que les corresponden. Probablemente una tanda se cargó dos veces.'
                    : 'Hay wallets con menos tokens de los que les corresponden.'}
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  {s.batch.problems.map((p) => (
                    <li key={p.address}>
                      <span className="font-mono text-xs">{short(p.address)}</span> — en el contrato{' '}
                      {fmt(p.onchainHack)} HACK, le corresponden {fmt(p.expectedHack)}
                    </li>
                  ))}
                </ul>
              </li>
            )}

            {s.checks && s.checks.unknownBeneficiaries > 0 && (
              <li className="flex gap-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span>
                  El contrato tiene {s.checks.unknownBeneficiaries} beneficiario(s) que no están en el lote.
                </span>
              </li>
            )}

            <Paso
              n={4}
              tone={!s.checks || s.checks.hash === 'unset' ? 'todo' : s.checks.hash === 'match' ? 'ok' : 'error'}
              titulo={!s.onchain.allocationListHash
                ? 'Hash del lote sin grabar'
                : s.checks?.hash === 'match'
                  ? 'Hash grabado: coincide con el lote'
                  : 'Hash grabado: NO coincide con el lote actual'}
            >
              {s.onchain.allocationListHash && (
                <span className="break-all font-mono text-xs">{s.onchain.allocationListHash}</span>
              )}
            </Paso>

            <Paso
              n={5}
              tone={s.onchain.finalized ? 'ok' : 'todo'}
              titulo={s.onchain.finalized ? 'Preventa finalizada en el contrato' : 'Preventa abierta en el contrato'}
            >
              {s.onchain.finalized && s.onchain.claimFrom
                ? `Finalizada el ${fecha(s.onchain.vestingStart!)} · los compradores pueden reclamar desde el ${fecha(s.onchain.claimFrom)}`
                : 'Se finaliza al final de todo, con el lote cargado y el hash grabado: después ya no acepta asignaciones.'}
            </Paso>
          </ol>
        </>
      )}
    </div>
  );
}

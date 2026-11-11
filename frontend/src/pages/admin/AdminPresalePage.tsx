// frontend/src/pages/admin/AdminPresalePage.tsx
//
// Revision de aportes de la preventa y exportacion del lote para el contrato.
//
// Decisiones del encargado que esta pantalla refleja:
//   - Valida un solo admin. No hay doble aprobacion por codigo.
//   - La fuente de verdad es la transferencia de USDT en Polygon. Al abrir un
//     aporte se verifica en cadena y "Validar" queda deshabilitado si no pasa.
//     El backend vuelve a verificar al validar, asi que esto es informativo:
//     no hay forma de saltearlo desde la UI.
//   - Exportar re-verifica cada aporte validado. Si una fila ya no se sostiene
//     en cadena, no se genera el lote y se muestra cual es.

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Loader2, ExternalLink, Download, Copy, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  adminApi,
  PresaleContributionRow,
  PresaleExport,
  PresaleExportProblem,
  PresaleStatus,
  PresaleVerification,
  PresaleVerificationReason,
} from '@/services/admin';
import { ApiServiceError } from '@/services/api';
import { PHASES } from '@/utils/presale';
import PresaleContractStatus from '@/components/admin/PresaleContractStatus';

type TabValue = PresaleStatus | 'all';

const TABS: { value: TabValue; label: string }[] = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'validated', label: 'Validados' },
  { value: 'rejected', label: 'Rechazados' },
  { value: 'all', label: 'Todos' },
];

/** Lo que el admin necesita entender de cada motivo, no el codigo interno. */
export const VERIFICATION_REASON_LABEL: Record<PresaleVerificationReason, string> = {
  NO_TX_HASH: 'El aporte no tiene hash de transacción.',
  TX_NOT_FOUND: 'La transacción no existe en Polygon.',
  TX_REVERTED: 'La transacción falló en cadena (revertida).',
  NO_USDT_TRANSFER: 'La transacción no movió USDT.',
  WRONG_RECIPIENT: 'El USDT no llegó a la tesorería oficial.',
  WRONG_SENDER: 'El pago salió de otra wallet, no de la del comprador. Puede ser un hash ajeno.',
  INSUFFICIENT_AMOUNT: 'Se transfirió menos de lo declarado.',
  RPC_ERROR: 'No se pudo consultar Polygon. Reintentá en un momento.',
};

const POLYGONSCAN_TX = 'https://polygonscan.com/tx/';
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

function statusBadge(status: PresaleStatus) {
  if (status === 'validated') return <Badge variant="default">Validado</Badge>;
  if (status === 'rejected') return <Badge variant="destructive">Rechazado</Badge>;
  return <Badge variant="outline">Pendiente</Badge>;
}

function shorten(v: string | null | undefined, head = 6, tail = 4) {
  if (!v) return '—';
  return v.length > head + tail + 1 ? `${v.slice(0, head)}…${v.slice(-tail)}` : v;
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const fmt = (n: string | number) => new Intl.NumberFormat('es-ES').format(Number(n));
// Dinero siempre con dos decimales: "618,447" es correcto en español (coma
// decimal) pero leido rapido parece seiscientos mil. "618,45" no da lugar a dudas.
const usd = (n: string | number) =>
  new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n));
const phaseLabel = (id: number) => PHASES.find((p) => p.id === id)?.label ?? `Fase ${id}`;

/** Extrae lo que el backend manda en el cuerpo de un error (verification, problems). */
function errorData<T>(err: unknown): T | undefined {
  return err instanceof ApiServiceError ? (err.data as T) : undefined;
}

function VerificationResult({ verification }: { verification: PresaleVerification }) {
  if (verification.ok) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <div>
          <p className="font-medium">Pago verificado en Polygon</p>
          <p className="text-muted-foreground">
            {usd(verification.amountUsdt)} USDT desde la wallet del comprador a la tesorería.
          </p>
        </div>
      </div>
    );
  }
  const reason = verification.reason ?? 'RPC_ERROR';
  const blando = reason === 'RPC_ERROR';
  return (
    <div
      className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
        blando ? 'border-amber-500/30 bg-amber-500/10' : 'border-destructive/40 bg-destructive/10'
      }`}
    >
      {blando
        ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
      <div>
        <p className="font-medium">{blando ? 'Verificación no disponible' : 'El pago no se verifica'}</p>
        <p className="text-muted-foreground">{VERIFICATION_REASON_LABEL[reason]}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dialogo de revision
// ---------------------------------------------------------------------------

function ReviewDialog({
  row, onClose, onDone,
}: {
  row: PresaleContributionRow | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => { setRejecting(false); setReason(''); }, [row?.id]);

  const isPending = row?.status === 'pending';

  // Solo los pendientes se verifican al abrir: es lo que el admin tiene que
  // decidir. Un validado ya se verifico al validarse y se re-verifica al exportar.
  const verification = useQuery({
    queryKey: ['admin', 'presale', 'verification', row?.id],
    queryFn: () => adminApi.verifyPresaleContribution(row!.id),
    enabled: !!row && isPending,
    retry: false,
    staleTime: 0,
  });

  // El 409 significa que otro admin ya lo reviso: se refresca, no se acusa error.
  function onReviewError(err: unknown, titulo: string) {
    if (err instanceof ApiServiceError && err.status === 409) {
      toast({ title: 'Ya fue revisado por otro admin', description: 'Actualizando la lista…' });
      onDone();
      return;
    }
    const v = errorData<{ verification?: PresaleVerification }>(err)?.verification;
    const descripcion = v && !v.ok && v.reason ? VERIFICATION_REASON_LABEL[v.reason] : (err as Error).message;
    toast({ title: titulo, description: descripcion, variant: 'destructive' });
  }

  const validate = useMutation({
    mutationFn: () => adminApi.validatePresaleContribution(row!.id),
    onSuccess: () => { toast({ title: 'Aporte validado' }); onDone(); },
    onError: (err) => onReviewError(err, 'No se pudo validar'),
  });

  const reject = useMutation({
    mutationFn: () => adminApi.rejectPresaleContribution(row!.id, reason.trim()),
    onSuccess: () => { toast({ title: 'Aporte rechazado' }); onDone(); },
    onError: (err) => onReviewError(err, 'No se pudo rechazar'),
  });

  const verificado = verification.data?.verification;
  const errorDeVerificacion = verification.error;
  const busy = validate.isPending || reject.isPending;
  const motivoValido = reason.trim().length >= 3;

  return (
    <Dialog open={!!row} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Revisar aporte #{row?.id}</DialogTitle>
          <DialogDescription>
            La fuente de verdad es la transferencia en Polygon, no la captura.
          </DialogDescription>
        </DialogHeader>

        {row && (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-muted-foreground">Wallet</dt>
              <dd className="break-all font-mono text-xs">{row.wallet_address}</dd>
              <dt className="text-muted-foreground">Fase</dt>
              <dd>{phaseLabel(row.phase_id)}</dd>
              <dt className="text-muted-foreground">Declarado</dt>
              <dd>${usd(row.usdt_amount)} USDT → {fmt(row.hack_amount)} HACK</dd>
              <dt className="text-muted-foreground">Transacción</dt>
              <dd>
                {row.tx_hash ? (
                  <a
                    href={`${POLYGONSCAN_TX}${row.tx_hash}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs underline underline-offset-2"
                  >
                    {shorten(row.tx_hash, 10, 8)} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : '—'}
              </dd>
              <dt className="text-muted-foreground">Captura</dt>
              <dd>
                {row.proof_cid ? (
                  <a
                    href={`${IPFS_GATEWAY}${row.proof_cid}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline underline-offset-2"
                  >
                    Ver en IPFS <ExternalLink className="h-3 w-3" />
                  </a>
                ) : <span className="text-muted-foreground">sin captura</span>}
              </dd>
              {row.reviewed_by && (
                <>
                  <dt className="text-muted-foreground">Revisó</dt>
                  <dd className="font-mono text-xs">
                    {shorten(row.reviewed_by)} · {formatDateTime(row.reviewed_at)}
                  </dd>
                </>
              )}
              {row.onchain_amount_usdt && (
                <>
                  <dt className="text-muted-foreground">En cadena</dt>
                  <dd>${usd(row.onchain_amount_usdt)} USDT</dd>
                </>
              )}
              {row.rejection_reason && (
                <>
                  <dt className="text-muted-foreground">Motivo</dt>
                  <dd>{row.rejection_reason}</dd>
                </>
              )}
            </dl>

            {isPending && (
              <div>
                {verification.isLoading || verification.isFetching ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Verificando en Polygon…
                  </div>
                ) : verificado ? (
                  <VerificationResult verification={verificado} />
                ) : errorDeVerificacion ? (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
                    <p className="font-medium">No se pudo verificar</p>
                    <p className="text-muted-foreground">
                      {errorData<{ detail?: string }>(errorDeVerificacion)?.detail
                        ?? (errorDeVerificacion as Error).message}
                    </p>
                  </div>
                ) : null}
                {!verification.isFetching && (verificado?.ok === false || errorDeVerificacion) && (
                  <Button variant="link" size="sm" className="px-0" onClick={() => verification.refetch()}>
                    Volver a verificar
                  </Button>
                )}
              </div>
            )}

            {isPending && rejecting && (
              <div className="space-y-1.5">
                <Label htmlFor="reject-reason">Motivo del rechazo (lo ve el comprador)</Label>
                <Textarea
                  id="reject-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={255}
                  placeholder="Ej.: la transferencia salió de una wallet distinta a la conectada."
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {!isPending ? (
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          ) : rejecting ? (
            <>
              <Button variant="outline" onClick={() => setRejecting(false)} disabled={busy}>Volver</Button>
              <Button variant="destructive" onClick={() => reject.mutate()} disabled={!motivoValido || busy}>
                {reject.isPending ? 'Rechazando…' : 'Confirmar rechazo'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setRejecting(true)} disabled={busy}>Rechazar</Button>
              <Button onClick={() => validate.mutate()} disabled={!verificado?.ok || busy}>
                {validate.isPending ? 'Validando…' : 'Validar'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Exportacion del lote
// ---------------------------------------------------------------------------

function ExportPanel({ validados, pendientes }: { validados: number; pendientes: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [resultado, setResultado] = useState<PresaleExport | null>(null);
  const [problemas, setProblemas] = useState<PresaleExportProblem[] | null>(null);

  const exportar = useMutation({
    mutationFn: () => adminApi.exportPresaleBatch(),
    onMutate: () => { setResultado(null); setProblemas(null); },
    onSuccess: (data) => setResultado(data),
    onError: (err) => {
      const data = errorData<{ problems?: PresaleExportProblem[]; pending?: number }>(err);
      if (err instanceof ApiServiceError && err.status === 422 && data?.problems) {
        setProblemas(data.problems);
        return;
      }
      // Entro un aporte nuevo despues de cargar la pagina: el backend tambien
      // se niega con pendientes.
      if (err instanceof ApiServiceError && err.status === 409 && data?.pending) {
        toast({
          title: 'Hay aportes pendientes',
          description: `Entraron ${data.pending} pendiente(s). Revisalos antes de generar el lote.`,
          variant: 'destructive',
        });
        qc.invalidateQueries({ queryKey: ['admin', 'presale'] });
        return;
      }
      toast({ title: 'No se pudo exportar', description: (err as Error).message, variant: 'destructive' });
    },
  });

  function descargar(csv: string, nombre: string) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Si quedan pendientes no hay lote: despues de finalizePresale el contrato
  // ya no acepta asignaciones, y ese comprador se quedaria sin tokens.
  const bloqueadoPorPendientes = pendientes > 0;

  async function copiarHash() {
    if (!resultado) return;
    await navigator.clipboard.writeText(resultado.hash);
    toast({ title: 'Hash copiado' });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/50 bg-background/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-title text-lg">Lote para el contrato</h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            Genera el archivo para <code>allocateBatch</code> y su hash para{' '}
            <code>setAllocationListHash</code>. Antes de generarlo vuelve a verificar en
            Polygon cada uno de los {validados} aportes validados: si alguno ya no se
            sostiene, no se exporta nada.
          </p>
        </div>
        <Button
          onClick={() => exportar.mutate()}
          disabled={exportar.isPending || validados === 0 || bloqueadoPorPendientes}
        >
          {exportar.isPending
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando…</>
            : 'Generar lote'}
        </Button>
      </div>

      {bloqueadoPorPendientes && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="font-medium">
              Hay {pendientes} aporte{pendientes === 1 ? '' : 's'} pendiente{pendientes === 1 ? '' : 's'} de revisión
            </p>
            <p className="text-muted-foreground">
              Validalos o rechazalos antes de generar el lote. Después de{' '}
              <code>finalizePresale</code> el contrato no acepta asignaciones nuevas: un aporte que
              quede afuera del lote final se queda sin tokens.
            </p>
          </div>
        </div>
      )}

      {problemas && (
        <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <p className="font-medium">
            No se exportó: {problemas.length} aporte{problemas.length === 1 ? '' : 's'} validado
            {problemas.length === 1 ? '' : 's'} no se sostiene{problemas.length === 1 ? '' : 'n'} en cadena.
          </p>
          <ul className="space-y-1">
            {problemas.map((p) => (
              <li key={p.id} className="text-muted-foreground">
                <span className="font-mono text-xs">#{p.id} · {shorten(p.wallet_address)}</span> —{' '}
                {VERIFICATION_REASON_LABEL[p.reason]}
              </li>
            ))}
          </ul>
        </div>
      )}

      {resultado && (
        <div className="space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <div><p className="text-muted-foreground">Wallets</p><p className="font-medium">{resultado.totals.wallets}</p></div>
            <div><p className="text-muted-foreground">Aportes</p><p className="font-medium">{resultado.totals.contributions}</p></div>
            <div><p className="text-muted-foreground">HACK totales</p><p className="font-medium">{fmt(resultado.totals.hack)}</p></div>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Hash para setAllocationListHash</p>
            <div className="flex items-center gap-2">
              <code className="break-all rounded bg-muted px-2 py-1 text-xs">{resultado.hash}</code>
              <Button size="icon" variant="ghost" onClick={copiarHash} aria-label="Copiar hash">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Se reproduce desde el archivo con{' '}
              <code>cast keccak "0x$(xxd -p lote.csv | tr -d '\n')"</code>
            </p>
          </div>
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => descargar(resultado.csv, `lote-preventa-${resultado.hash.slice(2, 10)}.csv`)}
            >
              <Download className="mr-2 h-4 w-4" /> Lote completo (el del hash)
            </Button>

            {resultado.batches.length === 1 ? (
              <p className="text-xs text-muted-foreground">
                Entra en una sola tanda: este mismo archivo se carga con <code>cargar-lote.sh</code>.
              </p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-muted-foreground">
                  Para cargar: {resultado.batches.length} tandas de hasta {resultado.batchSize} wallets,
                  una transacción de <code>allocateBatch</code> cada una. Concatenadas dan el lote completo.
                </p>
                <div className="flex flex-wrap gap-2">
                  {resultado.batches.map((b) => (
                    <Button
                      key={b.index}
                      size="sm"
                      variant="outline"
                      onClick={() => descargar(b.csv, `lote-preventa-${resultado.hash.slice(2, 10)}-tanda-${b.index}.csv`)}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Tanda {b.index} ({b.wallets})
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pagina
// ---------------------------------------------------------------------------

export default function AdminPresalePage() {
  const [tab, setTab] = useState<TabValue>('pending');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [reviewing, setReviewing] = useState<PresaleContributionRow | null>(null);
  const qc = useQueryClient();
  const perPage = 25;

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query = useQuery({
    queryKey: ['admin', 'presale', 'list', { tab, page, search }],
    queryFn: () => adminApi.listPresaleContributions({
      status: tab === 'all' ? undefined : tab,
      page,
      per_page: perPage,
      search: search || undefined,
    }),
    placeholderData: (prev) => prev,
    refetchInterval: 30_000,
  });

  function refrescar() {
    setReviewing(null);
    qc.invalidateQueries({ queryKey: ['admin', 'presale'] });
  }

  const rows = query.data?.contributions ?? [];
  const counts = query.data?.counts ?? { pending: 0, validated: 0, rejected: 0 };
  const total = query.data?.total ?? 0;
  const totalPages = query.data?.total_pages ?? 1;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-title text-3xl">Preventa</h1>
        <p className="text-sm text-muted-foreground">
          Revisión de aportes contra las transferencias de USDT en Polygon, y generación del
          lote para el contrato de preventa.
        </p>
      </header>

      <ExportPanel validados={counts.validated} pendientes={counts.pending} />

      <PresaleContractStatus />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => { setTab(v as TabValue); setPage(1); }}>
          <TabsList className="h-auto flex-wrap gap-1">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                {t.value !== 'all' && <span className="ml-1.5 text-xs opacity-60">{counts[t.value]}</span>}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Input
          type="search"
          placeholder="Buscar por wallet o hash…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="sm:max-w-xs"
          aria-label="Buscar aporte por wallet o hash"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/50 bg-background/40 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recibido</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead className="text-right">USDT</TableHead>
              <TableHead className="text-right">HACK</TableHead>
              <TableHead>Transacción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`sk-${i}`}>
                <TableCell colSpan={8}><Skeleton className="h-6 w-full" /></TableCell>
              </TableRow>
            ))}
            {!query.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  {search ? 'Ningún aporte coincide con la búsqueda.' : 'Sin aportes en este estado.'}
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap">{formatDateTime(row.created_at)}</TableCell>
                <TableCell className="font-mono text-xs" title={row.wallet_address}>{shorten(row.wallet_address)}</TableCell>
                <TableCell>{phaseLabel(row.phase_id)}</TableCell>
                <TableCell className="text-right">${usd(row.usdt_amount)}</TableCell>
                <TableCell className="text-right">{fmt(row.hack_amount)}</TableCell>
                <TableCell className="font-mono text-xs" title={row.tx_hash ?? ''}>
                  {row.tx_hash ? (
                    <a
                      href={`${POLYGONSCAN_TX}${row.tx_hash}`}
                      target="_blank" rel="noopener noreferrer"
                      className="underline underline-offset-2"
                    >
                      {shorten(row.tx_hash, 8, 6)}
                    </a>
                  ) : '—'}
                </TableCell>
                <TableCell>{statusBadge(row.status)}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant={row.status === 'pending' ? 'default' : 'outline'} onClick={() => setReviewing(row)}>
                    {row.status === 'pending' ? 'Revisar' : 'Ver'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} resultado{total === 1 ? '' : 's'}</span>
        <div className="inline-flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
          <span>Pág. {page} / {Math.max(1, totalPages)}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
        </div>
      </div>

      <ReviewDialog row={reviewing} onClose={() => setReviewing(null)} onDone={refrescar} />
    </section>
  );
}

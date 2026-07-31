// frontend/src/pages/admin/AdminTreasuryPage.tsx
//
// Worklist for the manual HACK->USDT->Harjoot settlement loop.
// Default tab is "awaiting_manual_conversion" (the actionable inbox).
// Mark-sent action records the USDT tx hash and flips the row to sent.

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { adminApi, TreasuryRow, TreasuryStatus } from '@/services/admin';
import { ApiServiceError } from '@/services/api';

type TabValue = TreasuryStatus | 'all';

const TABS: { value: TabValue; label: string }[] = [
  { value: 'awaiting_manual_conversion', label: 'Para settlear' },
  { value: 'pending',                    label: 'En cola' },
  { value: 'sent',                       label: 'Enviados' },
  { value: 'sent_but_not_notified',      label: 'Sin notificar' },
  { value: 'failed',                     label: 'Fallados' },
  { value: 'all',                        label: 'Todos' },
];

function statusBadge(status: string) {
  if (status === 'sent')                          return <Badge variant="default">Enviado</Badge>;
  if (status === 'awaiting_manual_conversion')    return <Badge variant="secondary">Manual</Badge>;
  if (status === 'pending')                       return <Badge variant="outline">Pendiente</Badge>;
  if (status === 'sent_but_not_notified')         return <Badge variant="secondary">Sin notificar</Badge>;
  if (status === 'failed')                        return <Badge variant="destructive">Fallado</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function shortenHash(h: string | null) {
  if (!h) return '—';
  return h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h;
}
function shortenWallet(w: string | null | undefined) {
  if (!w) return '—';
  return w.length > 10 ? `${w.slice(0, 6)}…${w.slice(-4)}` : w;
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminTreasuryPage() {
  const [tab, setTab] = useState<TabValue>('awaiting_manual_conversion');
  const [page, setPage] = useState(1);
  const [markRow, setMarkRow] = useState<TreasuryRow | null>(null);
  const [markHash, setMarkHash] = useState('');
  const limit = 25;
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['admin', 'treasury', { tab, page, limit }],
    queryFn: () => adminApi.listTreasury({ status: tab, page, limit }),
    placeholderData: (prev) => prev,
    refetchInterval: 30_000,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['admin', 'treasury'] });
    qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
  }

  const markMutation = useMutation({
    mutationFn: ({ id, hash }: { id: number; hash: string }) =>
      adminApi.markTreasurySent(id, hash),
    onSuccess: () => {
      toast({ title: 'Transferencia marcada como enviada' });
      setMarkRow(null);
      setMarkHash('');
      invalidate();
    },
    onError: (err) => {
      // A 409 (ALREADY_SENT/WRONG_STATE) means another admin already acted
      // on this row — the usecase is idempotent, so refresh instead of
      // showing a generic error.
      if (err instanceof ApiServiceError && err.status === 409) {
        toast({ title: 'Ya fue procesado por otro admin', description: 'Actualizando la lista…' });
        setMarkRow(null);
        setMarkHash('');
        invalidate();
        return;
      }
      const msg = err instanceof ApiServiceError ? err.message : String(err);
      toast({ title: 'No se pudo registrar', description: msg, variant: 'destructive' });
    },
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = query.data?.totalPages ?? 1;
  const hashIsValid = /^0x[a-fA-F0-9]{64}$/.test(markHash.trim());

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-title text-3xl">Treasury</h1>
        <p className="text-sm text-muted-foreground">
          Drenado manual de la cola HACK → USDT → Harjoot.
          Convertí HACK en USDT off-line y registrá el hash de la transferencia.
        </p>
      </header>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v as TabValue); setPage(1); }}>
        <TabsList className="flex-wrap h-auto gap-1">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Table */}
      <div className="rounded-lg border border-border/50 bg-background/40 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Creado</TableHead>
              <TableHead>Educator</TableHead>
              <TableHead className="text-right">USDT</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>USDT tx</TableHead>
              <TableHead>Enviado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`sk-${i}`}>
                <TableCell colSpan={7}><Skeleton className="h-6 w-full" /></TableCell>
              </TableRow>
            ))}
            {!query.isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  Sin filas en este estado.
                </TableCell>
              </TableRow>
            )}
            {items.map((row) => {
              const canMark = (
                row.status === 'awaiting_manual_conversion'
                || row.status === 'pending'
                || row.status === 'sent_but_not_notified'
              );
              return (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(row.createdAt)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {shortenWallet(row.payment?.fromWallet)}
                  </TableCell>
                  <TableCell className="text-right">${row.amountUsdtOwed}</TableCell>
                  <TableCell>{statusBadge(row.status)}</TableCell>
                  <TableCell className="font-mono text-xs" title={row.usdtTxHash ?? ''}>
                    {shortenHash(row.usdtTxHash)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDateTime(row.sentAt)}</TableCell>
                  <TableCell className="text-right">
                    {canMark ? (
                      <Button
                        size="sm"
                        onClick={() => { setMarkRow(row); setMarkHash(''); }}
                      >
                        Marcar enviado
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Footer + pagination */}
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

      {/* Mark-sent dialog */}
      <Dialog
        open={!!markRow}
        onOpenChange={(open) => { if (!open) { setMarkRow(null); setMarkHash(''); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar settlement manual</DialogTitle>
            <DialogDescription>
              Pegá el hash de la transferencia USDT que enviaste a Harjoot. Una vez registrado, la fila pasa a “Enviado” y no podrá modificarse.
            </DialogDescription>
          </DialogHeader>
          {markRow && (
            <div className="space-y-3 text-sm">
              <div className="space-y-1">
                <p><strong>Educator:</strong> <span className="font-mono">{markRow.payment?.fromWallet ?? '—'}</span></p>
                <p><strong>Monto USDT:</strong> ${markRow.amountUsdtOwed}</p>
                <p><strong>Pago HACK:</strong> {markRow.payment?.amountHack ?? '—'} HACK</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="usdt-hash">USDT tx hash</Label>
                <Input
                  id="usdt-hash"
                  placeholder="0x… (64 caracteres hex)"
                  value={markHash}
                  onChange={(e) => setMarkHash(e.target.value)}
                  className="font-mono text-xs"
                />
                {markHash && !hashIsValid && (
                  <p className="text-xs text-destructive">El hash debe ser 0x + 64 hex.</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMarkRow(null); setMarkHash(''); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => markRow && markMutation.mutate({ id: markRow.id, hash: markHash.trim() })}
              disabled={!hashIsValid || markMutation.isPending}
            >
              {markMutation.isPending ? 'Registrando…' : 'Marcar enviado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

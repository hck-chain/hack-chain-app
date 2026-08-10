// frontend/src/pages/admin/AdminPaymentDisputesPage.tsx
//
// Admin arbitration inbox for class-payment disputes (step 5/9 of the
// class-payment workflow: "HackChain confirmará sí o no se hizo el pago").
//   - Tabs across status (Abiertas / Pagadas / No pagadas / Todas).
//   - Resolve dialog: admin picks "Sí se pagó" or "No se pagó" + a note.

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { adminApi, PaymentDisputeRow } from '@/services/admin';
import { ApiServiceError } from '@/services/api';
import { isSafeHref } from '@/utils/safeLink';

type TabValue = 'open' | 'resolved_paid' | 'resolved_unpaid' | 'all';

const TABS: { value: TabValue; label: string }[] = [
  { value: 'open',            label: 'Abiertas' },
  { value: 'resolved_paid',   label: 'Pagadas' },
  { value: 'resolved_unpaid', label: 'No pagadas' },
  { value: 'all',             label: 'Todas' },
];

function statusBadge(status: PaymentDisputeRow['status']) {
  if (status === 'resolved_paid')   return <Badge variant="default">Pagada</Badge>;
  if (status === 'resolved_unpaid') return <Badge variant="destructive">No pagada</Badge>;
  return <Badge variant="secondary">Abierta</Badge>;
}

function shortenWallet(w: string) {
  return w.length > 10 ? `${w.slice(0, 6)}…${w.slice(-4)}` : w;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function proofLink(dispute: PaymentDisputeRow): string | null {
  const cr = dispute.classRequest;
  if (!cr) return null;
  const raw = dispute.dispute_type === 'deposit'
    ? cr.deposit_proof_url || (cr.deposit_proof_cid ? `ipfs://${cr.deposit_proof_cid}` : null)
    : cr.final_proof_url || (cr.final_proof_cid ? `ipfs://${cr.final_proof_cid}` : null);
  return isSafeHref(raw) ? raw : null;
}

export default function AdminPaymentDisputesPage() {
  const [tab, setTab] = useState<TabValue>('open');
  const [resolveRow, setResolveRow] = useState<PaymentDisputeRow | null>(null);
  const [note, setNote] = useState('');
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['admin', 'payment-disputes', tab],
    queryFn: () => adminApi.listPaymentDisputes(tab),
    refetchInterval: 30_000,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['admin', 'payment-disputes'] });
  }

  function handleConflictAwareError(err: unknown, fallbackTitle: string) {
    if (err instanceof ApiServiceError && err.status === 422) {
      toast({ title: 'Ya fue resuelta', description: 'Actualizando la lista…' });
      invalidate();
      return;
    }
    const msg = err instanceof ApiServiceError ? err.message : String(err);
    toast({ title: fallbackTitle, description: msg, variant: 'destructive' });
  }

  const resolveMutation = useMutation({
    mutationFn: ({ id, wasPaid }: { id: number; wasPaid: boolean }) =>
      adminApi.resolvePaymentDispute(id, wasPaid, note.trim() || undefined),
    onSuccess: () => {
      toast({ title: 'Disputa resuelta' });
      setResolveRow(null);
      setNote('');
      invalidate();
    },
    onError: (err) => {
      setResolveRow(null);
      setNote('');
      handleConflictAwareError(err, 'No se pudo resolver la disputa');
    },
  });

  const disputes = query.data?.disputes ?? [];

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-title text-3xl">Disputas de pago</h1>
        <p className="text-sm text-muted-foreground">
          Cuando el educador no confirma un pago, HackChain arbitra: revisa el comprobante y determina si el pago se hizo.
        </p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div>
        {query.isLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={`sk-${i}`} className="border-b border-white/[0.05] last:border-b-0 py-3.5">
            <Skeleton className="h-5 w-full" />
          </div>
        ))}

        {!query.isLoading && disputes.length === 0 && (
          <div className="text-center text-muted-foreground py-16">Sin disputas.</div>
        )}

        {disputes.map((d) => {
          const proof = proofLink(d);
          return (
            <div key={d.id} className="border-b border-white/[0.05] last:border-b-0 py-3.5 hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate">
                      {d.classRequest?.class_name || `Solicitud #${d.class_request_id}`}
                    </span>
                    <Badge variant="outline">{d.dispute_type === 'deposit' ? 'Depósito' : 'Pago final'}</Badge>
                    {statusBadge(d.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Educador: <span className="font-mono">{d.classRequest ? shortenWallet(d.classRequest.issuer_wallet_address) : '—'}</span>
                    {' · '}Talento: <span className="font-mono">{d.classRequest ? shortenWallet(d.classRequest.student_wallet_address) : '—'}</span>
                    {d.classRequest?.amount && ` · ${d.classRequest.amount} ${d.classRequest.currency}`}
                    {d.classRequest?.payment_network && ` · ${d.classRequest.payment_network}`}
                    {' · '}{formatDate(d.created_at)}
                  </p>
                  {proof && (
                    <a href={proof} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:text-purple-300 underline">
                      Ver comprobante
                    </a>
                  )}
                </div>
                {d.status === 'open' && (
                  <Button size="sm" variant="default" onClick={() => setResolveRow(d)} className="shrink-0">
                    Resolver
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!resolveRow} onOpenChange={(open) => { if (!open) { setResolveRow(null); setNote(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver disputa</DialogTitle>
            <DialogDescription>
              Determina si el pago se hizo. Esto confirma o revierte el estado de la solicitud de clase.
            </DialogDescription>
          </DialogHeader>
          {resolveRow && (
            <div className="space-y-3">
              <div className="text-sm space-y-1">
                <p><strong>Clase:</strong> {resolveRow.classRequest?.class_name || `#${resolveRow.class_request_id}`}</p>
                <p><strong>Etapa:</strong> {resolveRow.dispute_type === 'deposit' ? 'Depósito (50%)' : 'Pago final (50%)'}</p>
              </div>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nota de resolución (opcional)…"
                rows={3}
                maxLength={1000}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResolveRow(null); setNote(''); }}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={resolveMutation.isPending}
              onClick={() => resolveRow && resolveMutation.mutate({ id: resolveRow.id, wasPaid: false })}
            >
              No se pagó
            </Button>
            <Button
              disabled={resolveMutation.isPending}
              onClick={() => resolveRow && resolveMutation.mutate({ id: resolveRow.id, wasPaid: true })}
            >
              {resolveMutation.isPending ? 'Resolviendo…' : 'Sí se pagó'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

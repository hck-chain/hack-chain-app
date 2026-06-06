// frontend/src/pages/admin/AdminEducatorsPage.tsx
//
// Admin inbox for educator approvals.
//   - Tabs across status (All / Pending / Approved / Rejected) — Pending
//     is the default tab because it's the actionable list.
//   - Search input over name + email + organization (server-side).
//   - Table with approve/reject actions on each pending row.
//   - Approve = confirm dialog. Reject = required reason textarea.
//   - Pagination at the foot.

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { adminApi, EducatorRow, EducatorStatus } from '@/services/admin';
import { ApiServiceError } from '@/services/api';

type TabValue = 'pending_approval' | 'approved' | 'rejected' | 'all';

const TABS: { value: TabValue; label: string }[] = [
  { value: 'pending_approval', label: 'Pendientes' },
  { value: 'approved',         label: 'Aprobados'  },
  { value: 'rejected',         label: 'Rechazados' },
  { value: 'all',              label: 'Todos'      },
];

function statusBadge(status: EducatorStatus | string) {
  if (status === 'approved')         return <Badge variant="default">Aprobado</Badge>;
  if (status === 'pending_approval') return <Badge variant="secondary">Pendiente</Badge>;
  if (status === 'rejected')         return <Badge variant="destructive">Rechazado</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function shortenWallet(w: string) {
  return w.length > 10 ? `${w.slice(0, 6)}…${w.slice(-4)}` : w;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminEducatorsPage() {
  const [tab, setTab] = useState<TabValue>('pending_approval');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirmRow, setConfirmRow] = useState<EducatorRow | null>(null);
  const [rejectRow, setRejectRow]   = useState<EducatorRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const limit = 25;
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['admin', 'educators', { tab, search, page, limit }],
    queryFn: () => adminApi.listEducators({ status: tab, search, page, limit }),
    placeholderData: (prev) => prev,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['admin', 'educators'] });
    qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
  }

  const approveMutation = useMutation({
    mutationFn: (userId: number) => adminApi.approveEducator(userId),
    onSuccess: () => {
      toast({ title: 'Educator aprobado' });
      setConfirmRow(null);
      invalidate();
    },
    onError: (err) => {
      const msg = err instanceof ApiServiceError ? err.message : String(err);
      toast({ title: 'No se pudo aprobar', description: msg, variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
      adminApi.rejectEducator(userId, reason),
    onSuccess: () => {
      toast({ title: 'Educator rechazado' });
      setRejectRow(null);
      setRejectReason('');
      invalidate();
    },
    onError: (err) => {
      const msg = err instanceof ApiServiceError ? err.message : String(err);
      toast({ title: 'No se pudo rechazar', description: msg, variant: 'destructive' });
    },
  });

  const items = query.data?.items ?? [];
  const totalPages = query.data?.totalPages ?? 1;
  const total = query.data?.total ?? 0;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-title text-3xl">Educators</h1>
        <p className="text-sm text-muted-foreground">
          Aprobá o rechazá las solicitudes de educators. Las pendientes son tu pila prioritaria.
        </p>
      </header>

      {/* Tabs + search */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={(v) => { setTab(v as TabValue); setPage(1); }}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por nombre, email u organización"
          className="lg:max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border/50 bg-background/40 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organización</TableHead>
              <TableHead>Educator</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Registro</TableHead>
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
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
            {items.map((row) => {
              const fullName = [row.name, row.lastname].filter(Boolean).join(' ') || '—';
              const isPending = row.status === 'pending_approval';
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.organizationName ?? '—'}</TableCell>
                  <TableCell>{fullName}</TableCell>
                  <TableCell>{row.email ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{shortenWallet(row.walletAddress)}</TableCell>
                  <TableCell>{statusBadge(row.status)}</TableCell>
                  <TableCell>{formatDate(row.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {isPending ? (
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="default" onClick={() => setConfirmRow(row)}>
                          Aprobar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRejectRow(row)}>
                          Rechazar
                        </Button>
                      </div>
                    ) : row.status === 'rejected' && row.rejectionReason ? (
                      <span className="text-xs text-muted-foreground italic" title={row.rejectionReason}>
                        Motivo registrado
                      </span>
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

      {/* Approve confirm dialog */}
      <Dialog open={!!confirmRow} onOpenChange={(open) => !open && setConfirmRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar educator</DialogTitle>
            <DialogDescription>
              Se enviará una notificación al educator y podrá emitir certificados desde ese momento.
            </DialogDescription>
          </DialogHeader>
          {confirmRow && (
            <div className="text-sm space-y-1">
              <p><strong>Organización:</strong> {confirmRow.organizationName ?? '—'}</p>
              <p><strong>Email:</strong> {confirmRow.email ?? '—'}</p>
              <p><strong>Wallet:</strong> <span className="font-mono">{confirmRow.walletAddress}</span></p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRow(null)}>Cancelar</Button>
            <Button
              onClick={() => confirmRow && approveMutation.mutate(confirmRow.id)}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Aprobando…' : 'Aprobar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject reason dialog */}
      <Dialog
        open={!!rejectRow}
        onOpenChange={(open) => { if (!open) { setRejectRow(null); setRejectReason(''); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar educator</DialogTitle>
            <DialogDescription>
              El motivo se guarda en el perfil y se le envía por email.
            </DialogDescription>
          </DialogHeader>
          {rejectRow && (
            <div className="space-y-3">
              <div className="text-sm space-y-1">
                <p><strong>Organización:</strong> {rejectRow.organizationName ?? '—'}</p>
                <p><strong>Email:</strong> {rejectRow.email ?? '—'}</p>
              </div>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Motivo del rechazo (visible para el educator)…"
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">{rejectReason.length}/1000</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectRow(null); setRejectReason(''); }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectRow && rejectMutation.mutate({ userId: rejectRow.id, reason: rejectReason.trim() })}
              disabled={rejectMutation.isPending || rejectReason.trim().length === 0}
            >
              {rejectMutation.isPending ? 'Rechazando…' : 'Rechazar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

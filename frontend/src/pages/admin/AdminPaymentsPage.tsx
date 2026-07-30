// frontend/src/pages/admin/AdminPaymentsPage.tsx
//
// Historical view of HACK payments. Filters: date range, fromWallet,
// status. Each row links to the related certificate (when present).
//
// No mutations — pure listing.

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { adminApi } from '@/services/admin';

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'confirmed', label: 'Confirmados' },
  { value: 'all',       label: 'Todos' },
];

function shortenHash(h: string) {
  return h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h;
}

function shortenWallet(w: string) {
  return w.length > 10 ? `${w.slice(0, 6)}…${w.slice(-4)}` : w;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function paymentStatusBadge(status: string) {
  if (status === 'confirmed') return <Badge variant="default">Confirmado</Badge>;
  if (status === 'pending')   return <Badge variant="secondary">Pendiente</Badge>;
  if (status === 'failed')    return <Badge variant="destructive">Fallado</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default function AdminPaymentsPage() {
  const [from, setFrom]             = useState('');
  const [to, setTo]                 = useState('');
  const [fromWallet, setFromWallet] = useState('');
  const [status, setStatus]         = useState('confirmed');
  const [page, setPage]             = useState(1);
  const limit = 25;

  // Live-applied filters — the inputs always update on keystroke; the
  // query refetches when the keys change. fromWallet validates client-
  // side to avoid sending obviously-bad values to the backend.
  const walletParam = /^0x[a-fA-F0-9]{40}$/.test(fromWallet.trim())
    ? fromWallet.trim()
    : undefined;

  const query = useQuery({
    queryKey: ['admin', 'payments', { from, to, walletParam, status, page, limit }],
    queryFn: () => adminApi.listPayments({
      from: from || undefined,
      to:   to   || undefined,
      fromWallet: walletParam,
      status,
      page, limit,
    }),
    placeholderData: (prev) => prev,
    refetchInterval: 30_000,
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = query.data?.totalPages ?? 1;

  function clearFilters() {
    setFrom(''); setTo(''); setFromWallet(''); setStatus('confirmed'); setPage(1);
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-title text-3xl">Pagos</h1>
        <p className="text-sm text-muted-foreground">
          Historial de pagos HACK procesados. Filtrá por wallet, rango de fechas o estado.
        </p>
      </header>

      {/* Filters */}
      <div className="rounded-lg border border-border/40 bg-background/40 backdrop-blur-sm p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="space-y-1">
          <Label htmlFor="pay-from" className="text-xs">Desde</Label>
          <Input id="pay-from" type="date" value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pay-to" className="text-xs">Hasta</Label>
          <Input id="pay-to" type="date" value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        </div>
        <div className="space-y-1 lg:col-span-2">
          <Label htmlFor="pay-wallet" className="text-xs">Wallet del educator</Label>
          <Input id="pay-wallet" placeholder="0x…"
            value={fromWallet}
            onChange={(e) => { setFromWallet(e.target.value); setPage(1); }}
            className="font-mono text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Estado</Label>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 lg:col-span-5 flex justify-end">
          <Button size="sm" variant="ghost" onClick={clearFilters}>Limpiar filtros</Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border/50 bg-background/40 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tx hash</TableHead>
              <TableHead>Educator</TableHead>
              <TableHead className="text-right">HACK</TableHead>
              <TableHead className="text-right">USD</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Certificado</TableHead>
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
                  Sin resultados para los filtros aplicados.
                </TableCell>
              </TableRow>
            )}
            {items.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap">{formatDateTime(row.createdAt)}</TableCell>
                <TableCell className="font-mono text-xs" title={row.txHash}>
                  {shortenHash(row.txHash)}
                </TableCell>
                <TableCell className="font-mono text-xs">{shortenWallet(row.fromWallet)}</TableCell>
                <TableCell className="text-right">{row.amountHack}</TableCell>
                <TableCell className="text-right">${row.userPriceUsd}</TableCell>
                <TableCell>{paymentStatusBadge(row.status)}</TableCell>
                <TableCell>
                  {row.certificate ? (
                    <span title={row.certificate.title ?? ''}>
                      #{row.certificate.tokenId ?? '—'}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
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
    </section>
  );
}

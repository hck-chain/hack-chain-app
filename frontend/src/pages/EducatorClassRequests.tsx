import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock, CheckCircle, XCircle, Flag, Calendar, Timer, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import { useEducatorClassRequests, useUpdateClassRequestStatus, type EducatorClassRequest } from '@/hooks/useEducatorClassRequests';

type FilterTab = 'all' | 'pending' | 'confirmed' | 'history';

const STATUS_META: Record<EducatorClassRequest['status'], {
  label: string;
  className: string;
  icon: React.ElementType;
}> = {
  pending:   { label: 'Pendiente',  className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',   icon: Clock },
  confirmed: { label: 'Confirmada', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  cancelled: { label: 'Cancelada',  className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',   icon: XCircle },
  completed: { label: 'Completada', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: Flag },
};

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function RequestRow({ request }: { request: EducatorClassRequest }) {
  const { mutate: updateStatus, isPending } = useUpdateClassRequestStatus();
  const meta = STATUS_META[request.status];
  const StatusIcon = meta.icon;

  const canConfirm  = request.status === 'pending';
  const canCancel   = request.status === 'pending' || request.status === 'confirmed';
  const canComplete = request.status === 'confirmed';

  return (
    <div className="py-4 border-b border-white/[0.05] last:border-b-0">
      <div className="flex items-start gap-3">
        {/* Avatar placeholder */}
        <div className="h-9 w-9 rounded-full bg-purple-950/80 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <User className="h-4 w-4 text-purple-300" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Top row: name + status badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-semibold text-white leading-tight">
              {request.student_name || request.student_wallet.slice(0, 8) + '…'}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-px rounded text-[10px] font-semibold border ${meta.className}`}>
              <StatusIcon className="h-2.5 w-2.5" />
              {meta.label}
            </span>
          </div>

          {/* Class name */}
          {request.class_name && (
            <p className="text-xs text-purple-400 mt-0.5 truncate">{request.class_name}</p>
          )}

          {/* Date / time / duration */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Calendar className="h-3 w-3 shrink-0" />
              {formatDate(request.requested_date)} · {request.start_time}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Timer className="h-3 w-3 shrink-0" />
              {request.duration_minutes} min
            </span>
            {request.hourly_rate_usd != null && (
              <span className="text-xs text-slate-500">${request.hourly_rate_usd} USD</span>
            )}
          </div>

          {/* Student message */}
          {request.student_message && (
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 italic">
              "{request.student_message}"
            </p>
          )}

          {/* Action buttons */}
          {(canConfirm || canCancel || canComplete) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {canConfirm && (
                <button
                  disabled={isPending}
                  onClick={() => updateStatus({ id: request.id, status: 'confirmed' })}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[36px]"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Confirmar
                </button>
              )}
              {canComplete && (
                <button
                  disabled={isPending}
                  onClick={() => updateStatus({ id: request.id, status: 'completed' })}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[36px]"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Completar
                </button>
              )}
              {canCancel && (
                <button
                  disabled={isPending}
                  onClick={() => updateStatus({ id: request.id, status: 'cancelled' })}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] text-slate-500 border border-white/[0.06] hover:text-slate-300 hover:bg-white/[0.07] disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[36px]"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancelar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex gap-3 py-4 border-b border-white/[0.05] animate-pulse">
      <div className="h-9 w-9 rounded-full bg-white/[0.05] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <div className="h-3.5 w-28 bg-white/[0.05] rounded-full" />
          <div className="h-3.5 w-16 bg-white/[0.04] rounded" />
        </div>
        <div className="h-2.5 w-48 bg-white/[0.04] rounded-full" />
        <div className="h-2.5 w-32 bg-white/[0.03] rounded-full" />
      </div>
    </div>
  );
}

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',       label: 'Todas' },
  { id: 'pending',   label: 'Pendientes' },
  { id: 'confirmed', label: 'Confirmadas' },
  { id: 'history',   label: 'Historial' },
];

export default function EducatorClassRequests() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const { data, isPending } = useEducatorClassRequests();

  const all = data?.requests ?? [];

  const filtered = all.filter((r) => {
    if (activeTab === 'all')       return true;
    if (activeTab === 'pending')   return r.status === 'pending';
    if (activeTab === 'confirmed') return r.status === 'confirmed';
    if (activeTab === 'history')   return r.status === 'cancelled' || r.status === 'completed';
    return true;
  });

  const pendingCount = all.filter((r) => r.status === 'pending').length;

  return (
    <Layout>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-20 backdrop-blur-xl border-b border-white/[0.06]"
        style={{ backgroundColor: 'oklch(0.11 0.012 280 / 0.88)' }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between h-14 gap-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors min-h-[44px] px-2 -ml-2 rounded-lg"
              aria-label="Volver"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Volver</span>
            </button>

            <div className="flex items-center gap-2">
              <img
                src="/icons/maletinNeon.avif"
                alt=""
                className="h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] shrink-0"
              />
              <h1 className="font-title text-sm font-semibold text-white">
                Solicitudes de Clases
              </h1>
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 tabular-nums">
                  {pendingCount}
                </span>
              )}
            </div>

            <div className="w-16 sm:w-20" aria-hidden="true" />
          </div>

          {/* Filter tabs */}
          <div className="flex border-b border-white/[0.08] -mb-px">
            {TABS.map((tab) => {
              const count = tab.id === 'all' ? all.length
                : tab.id === 'pending'   ? all.filter(r => r.status === 'pending').length
                : tab.id === 'confirmed' ? all.filter(r => r.status === 'confirmed').length
                : all.filter(r => r.status === 'cancelled' || r.status === 'completed').length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-white border-b-2 border-purple-500'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-[10px] tabular-nums ${activeTab === tab.id ? 'text-purple-400' : 'text-slate-600'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-28">
        {isPending && (
          <div>
            {[...Array(5)].map((_, i) => <RowSkeleton key={i} />)}
          </div>
        )}

        {!isPending && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
            <Clock className="h-10 w-10 text-slate-700" />
            <p className="text-sm text-slate-500">
              {activeTab === 'pending'
                ? 'No hay solicitudes pendientes'
                : 'No hay solicitudes en esta sección'}
            </p>
          </div>
        )}

        {!isPending && filtered.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {filtered.map((req) => (
                <RequestRow key={req.id} request={req} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </Layout>
  );
}

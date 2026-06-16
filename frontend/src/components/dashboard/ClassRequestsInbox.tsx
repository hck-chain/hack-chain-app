import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, BookOpen, Clock, CalendarDays, MessageSquare, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClassRequests, useUpdateClassRequestStatus, type ClassRequest } from '@/hooks/useClassRequests';
import { useToast } from '@/hooks/use-toast';

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  completed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function RequestCard({ req, onAction }: { req: ClassRequest; onAction: (id: number, status: 'confirmed' | 'cancelled' | 'completed') => void }) {
  const { t } = useTranslation();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="relative rounded-2xl bg-white/[0.03] border border-white/8 p-4 sm:p-5 hover:border-white/15 transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        {/* Left — info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-title text-sm font-bold text-white truncate">
              {req.student_name || `${req.student_wallet.slice(0, 6)}…${req.student_wallet.slice(-4)}`}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLES[req.status] ?? ''}`}>
              {t(`classInbox.status.${req.status}`, req.status)}
            </span>
          </div>

          {req.class_name && (
            <div className="flex items-center gap-1.5 text-xs text-purple-400">
              <BookOpen className="h-3 w-3 shrink-0" />
              <span className="truncate">{req.class_name}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3 shrink-0" />
              {formatDate(req.requested_date)} · {req.start_time}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" />
              {req.duration_minutes} {t('classInbox.min')}
            </span>
            {req.hourly_rate_usd && (
              <span className="text-slate-500">${parseFloat(req.hourly_rate_usd).toFixed(0)}/h</span>
            )}
          </div>

          {req.student_message && (
            <div className="flex items-start gap-1.5 text-xs text-slate-500 italic">
              <MessageSquare className="h-3 w-3 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{req.student_message}</span>
            </div>
          )}
        </div>

        {/* Right — actions */}
        {req.status === 'pending' && (
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => onAction(req.id, 'confirmed')}
              className="h-8 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              {t('classInbox.confirm')}
            </Button>
            <Button
              size="sm"
              onClick={() => onAction(req.id, 'cancelled')}
              className="h-8 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              {t('classInbox.cancel')}
            </Button>
          </div>
        )}

        {req.status === 'confirmed' && (
          <Button
            size="sm"
            onClick={() => onAction(req.id, 'completed')}
            className="h-8 px-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-xl text-xs font-semibold shrink-0"
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            {t('classInbox.complete')}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function ClassRequestsInbox() {
  const { t } = useTranslation();
  const { data: requests, isPending } = useClassRequests();
  const update = useUpdateClassRequestStatus();
  const { toast } = useToast();

  const handleAction = (id: number, status: 'confirmed' | 'cancelled' | 'completed') => {
    update.mutate({ id, status }, {
      onSuccess: () => {
        toast({ title: t(`classInbox.toast.${status}`) });
      },
      onError: () => {
        toast({ title: t('classInbox.toast.error'), variant: 'destructive' });
      },
    });
  };

  const pending = requests?.filter((r) => r.status === 'pending') ?? [];
  const others  = requests?.filter((r) => r.status !== 'pending') ?? [];
  const sorted  = [...pending, ...others];

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-title text-sm font-bold uppercase tracking-[0.18em] text-white/40">
          {t('classInbox.title')}
        </h2>
        {pending.length > 0 && (
          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
            {pending.length}
          </span>
        )}
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
          <div className="h-4 w-4 rounded-full border-2 border-slate-600 border-t-purple-400 animate-spin" />
          {t('classInbox.loading')}
        </div>
      )}

      {!isPending && sorted.length === 0 && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/6 px-6 py-8 text-center">
          <p className="text-sm text-slate-500">{t('classInbox.empty')}</p>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {sorted.map((req) => (
          <div key={req.id} className="mb-3">
            <RequestCard req={req} onAction={handleAction} />
          </div>
        ))}
      </AnimatePresence>
    </section>
  );
}

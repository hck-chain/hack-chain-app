import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, CalendarDays, Clock, ChevronRight, CalendarPlus, Download, Calendar, Award, CreditCard, AlertTriangle, Link as LinkIcon, CheckCircle, Flag, Wallet, Loader2, Video } from 'lucide-react';
import Layout from '@/components/Layout';
import { PriceTag } from '@/components/PriceTag';
import { CopyButton } from '@/components/CopyButton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from '@/components/ui/dialog';
import { resolveIpfs } from '@/lib/ipfs';
import {
  useMyClassRequests, useCancelClassRequest, useSubmitPaymentProof, useDisputePayment,
  type MyClassRequest, type PaymentStage,
} from '@/hooks/useMyClassRequests';
import {
  usePendingCertificateConfirmations, useConfirmCertificate, useFlagCertificateIssue,
  type PendingConfirmationCertificate,
} from '@/hooks/useCertificateConfirmation';
import { buildGoogleCalendarUrl, downloadICS } from '@/utils/calendarUtils';
import { api, ApiServiceError } from '@/services/api';
import { web3Service } from '@/utils/web3Service';

type StatusKey = 'pending' | 'confirmed' | 'cancelled' | 'completed';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const STATUS_DOT: Record<StatusKey, string> = {
  pending:   'bg-amber-400',
  confirmed: 'bg-emerald-400',
  cancelled: 'bg-slate-600',
  completed: 'bg-slate-500',
};

const STATUS_TEXT: Record<StatusKey, string> = {
  pending:   'text-amber-500',
  confirmed: 'text-emerald-500',
  cancelled: 'text-slate-600',
  completed: 'text-slate-500',
};

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function EduAvatar({ photo, label }: { photo: string | null; label: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initial = label.trim()[0]?.toUpperCase() ?? '?';

  const resolvedSrc = resolveIpfs(photo);

  if (resolvedSrc && !imgFailed) {
    return (
      <img
        src={resolvedSrc}
        alt={label}
        className="h-10 w-10 rounded-full object-cover shrink-0 border border-white/[0.08]"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div className="h-10 w-10 rounded-full bg-white/[0.12] border border-white/[0.1] flex items-center justify-center shrink-0 select-none">
      <span className="text-[13px] font-semibold text-slate-200 leading-none">{initial}</span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-white/[0.05] animate-pulse last:border-b-0">
      <div className="h-10 w-10 rounded-full bg-white/[0.06] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-36 bg-white/[0.07] rounded-full" />
        <div className="h-2.5 w-52 bg-white/[0.04] rounded-full" />
      </div>
      <div className="h-3 w-14 bg-white/[0.04] rounded-full shrink-0" />
    </div>
  );
}

function CalendarActions({ req }: { req: MyClassRequest }) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const title = req.class_name
    ? `Clase: ${req.class_name}`
    : req.issuer_organization
    ? `Clase con ${req.issuer_organization}`
    : 'Clase — HackChain';

  const params = {
    title,
    requestedDate: req.requested_date,
    startTime: req.start_time,
    durationMinutes: req.duration_minutes,
    description: [
      req.issuer_organization ? `Educador: ${req.issuer_organization}` : null,
      req.class_name ? `Clase: ${req.class_name}` : null,
      'Sesión privada reservada a través de HackChain.',
    ].filter(Boolean).join('\n'),
    uid: `hackchain-class-${req.id}@hackchain.app`,
  };

  return (
    <div className="flex items-center gap-0.5 mt-2">
      <motion.a
        href={buildGoogleCalendarUrl(params)}
        target="_blank"
        rel="noopener noreferrer"
        whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
        transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
        className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] min-h-[36px]"
        style={{ transition: 'color 150ms ease-out, background-color 150ms ease-out' }}
      >
        <CalendarPlus className="h-3 w-3 shrink-0" />
        {t('calendar.googleCalendar')}
      </motion.a>
      <motion.button
        whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
        transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
        onClick={() => downloadICS(params)}
        className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-300 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] min-h-[36px]"
        style={{ transition: 'color 150ms ease-out, background-color 150ms ease-out' }}
        title={t('calendar.downloadIcs')}
      >
        <Download className="h-3 w-3 shrink-0" />
        .ics
      </motion.button>
    </div>
  );
}

const STAGE_BY_PAYMENT_STATUS: Partial<Record<MyClassRequest['payment_status'], PaymentStage>> = {
  unpaid: 'deposit',
  deposit_confirmed: 'final',
};

const WALLET_PAY_ERROR_KEYS: Record<string, string> = {
  TX_NOT_FOUND: 'talentClasses.payment.wallet.errorTxNotFound',
  TX_REVERTED: 'talentClasses.payment.wallet.errorTxReverted',
  NO_USDT_TRANSFER: 'talentClasses.payment.wallet.errorNoTransfer',
  WRONG_RECIPIENT: 'talentClasses.payment.wallet.errorWrongRecipient',
  WRONG_SENDER: 'talentClasses.payment.wallet.errorWrongSender',
  INSUFFICIENT_AMOUNT: 'talentClasses.payment.wallet.errorInsufficientAmount',
  TX_ALREADY_USED: 'talentClasses.payment.wallet.errorAlreadyUsed',
  MISSING_PRICE: 'talentClasses.payment.wallet.errorMissingPrice',
};

function PaymentAction({ req }: { req: MyClassRequest }) {
  const { t } = useTranslation();
  const { mutate: submitProof, isPending: isSubmitting } = useSubmitPaymentProof();
  const { mutate: disputePayment, isPending: isDisputing } = useDisputePayment();
  const [proofUrl, setProofUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPayingWithWallet, setIsPayingWithWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const stage = STAGE_BY_PAYMENT_STATUS[req.payment_status];

  if (req.payment_status === 'deposit_disputed' || req.payment_status === 'final_disputed') {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-[12px] text-amber-500">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        {t('talentClasses.payment.disputed')}
      </div>
    );
  }

  if (req.payment_status === 'deposit_submitted' || req.payment_status === 'final_submitted') {
    const submittedStage = req.payment_status === 'deposit_submitted' ? 'deposit' : 'final';
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-slate-500">{t('talentClasses.payment.awaitingConfirmation')}</span>
        <button
          onClick={() => disputePayment({ id: req.id, stage: submittedStage })}
          disabled={isDisputing}
          className="text-[12px] text-amber-400 hover:text-amber-300 underline disabled:opacity-40"
        >
          {t('talentClasses.payment.noResponse')}
        </button>
      </div>
    );
  }

  if (!stage) return null;

  const stageAmountUsdt = req.hourly_rate_usd
    ? (parseFloat(String(req.hourly_rate_usd)) * req.duration_minutes) / 120
    : null;

  const handlePayWithWallet = async () => {
    if (!stageAmountUsdt) return;
    setWalletError(null);
    setIsPayingWithWallet(true);
    try {
      const { txHash } = await web3Service.payClassStageWithUsdt(req.issuer_wallet, stageAmountUsdt);
      submitProof(
        { id: req.id, stage, txHash },
        {
          onError: (err) => {
            const code = err instanceof ApiServiceError ? String(err.message) : null;
            setWalletError(code && WALLET_PAY_ERROR_KEYS[code]
              ? t(WALLET_PAY_ERROR_KEYS[code])
              : t('talentClasses.payment.wallet.errorGeneric'));
          },
        }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : null;
      setWalletError(message || t('talentClasses.payment.wallet.errorGeneric'));
    } finally {
      setIsPayingWithWallet(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.upload<{ cid: string }>('/api/upload/payment-proof', formData);
      submitProof({ id: req.id, stage, proofCid: result.cid, currency: req.currency || 'USDT' });
    } catch {
      setError(t('talentClasses.payment.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <p className="text-[12px] font-semibold text-white/70">
        {stage === 'deposit' ? t('talentClasses.payment.depositPrompt') : t('talentClasses.payment.finalPrompt')}
      </p>

      {stageAmountUsdt != null && (
        <button
          onClick={handlePayWithWallet}
          disabled={isPayingWithWallet || isSubmitting}
          className="w-full flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[13px] font-semibold text-white bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 px-4 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[40px]"
        >
          {isPayingWithWallet
            ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            : <Wallet className="h-4 w-4 shrink-0" />}
          {t('talentClasses.payment.wallet.payButton')}
          <PriceTag usdAmount={stageAmountUsdt} className="text-[13px]" />
        </button>
      )}
      {walletError && <p className="text-[11px] text-red-400">{walletError}</p>}

      <div className="flex items-center gap-2 text-[11px] text-slate-600">
        <div className="h-px flex-1 bg-white/[0.06]" />
        {t('talentClasses.payment.wallet.orManual')}
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>

      <div className="flex items-center justify-between gap-2 bg-white/[0.04] border border-white/8 rounded-xl px-3 py-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-0.5">
            {t('talentClasses.payment.wallet.addressLabel', 'Wallet del educador')}
          </p>
          <p className="text-[12px] font-mono text-slate-300 truncate" title={req.issuer_wallet}>
            {req.issuer_wallet}
          </p>
        </div>
        <CopyButton value={req.issuer_wallet} size="sm" />
      </div>
      <p className="text-[11px] text-slate-600 leading-relaxed">
        {t('talentClasses.payment.wallet.addressHint', 'Puedes transferir por cualquier red que prefieras (Tron, BNB Chain, etc.) — luego sube el comprobante o el link de la transacción abajo.')}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-1.5 flex-1 min-w-[160px] bg-white/[0.04] border border-white/8 rounded-xl px-2.5 py-1.5">
          <LinkIcon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <input
            type="url"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            placeholder={t('talentClasses.payment.linkPlaceholder')}
            className="flex-1 bg-transparent text-[12px] text-white placeholder:text-slate-600 focus:outline-none"
          />
        </div>
        <button
          onClick={() => submitProof({ id: req.id, stage, proofUrl: proofUrl.trim(), currency: req.currency || 'USDT' })}
          disabled={!proofUrl.trim() || isSubmitting}
          className="inline-flex items-center gap-1.5 text-[12px] text-emerald-400 hover:text-emerald-300 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[36px]"
        >
          <CreditCard className="h-3.5 w-3.5 shrink-0" />
          {t('talentClasses.payment.submitLink')}
        </button>
        <label className="inline-flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors min-h-[36px]">
          {uploading ? t('talentClasses.payment.uploading') : t('talentClasses.payment.uploadScreenshot')}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
        </label>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

function ClassDetail({ req }: { req: MyClassRequest }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { mutate: cancelRequest, isPending: isCancelling } = useCancelClassRequest();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const status = req.status as StatusKey;
  const label = req.issuer_organization || req.issuer_wallet;

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/educator/${req.issuer_wallet}`)}
          className="inline-flex items-center gap-0.5 text-[12px] text-slate-500 hover:text-slate-300 min-h-[36px] -ml-1 px-1 rounded-lg"
          style={{ transition: 'color 150ms ease-out' }}
          aria-label={`Ver perfil de ${label}`}
        >
          {t('talentClasses.viewProfile')}
          <ChevronRight className="h-3 w-3 shrink-0" />
        </button>

        {/* Cancel — only for pending requests */}
        {status === 'pending' && (
          <AnimatePresence mode="wait" initial={false}>
            {confirmCancel ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.14, ease: EASE }}
                className="flex items-center gap-1"
              >
                <span className="text-[11px] text-slate-500 mr-1">
                  {t('talentClasses.confirmCancel', '¿Retirar?')}
                </span>
                <motion.button
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                  transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
                  disabled={isCancelling}
                  onClick={() => cancelRequest({ id: req.id, reason: cancelReason.trim() || undefined })}
                  className="text-[11px] font-medium text-red-500 hover:text-red-400 min-h-[36px] px-2 rounded-lg hover:bg-red-500/[0.07] disabled:opacity-40 transition-colors duration-150"
                >
                  {t('talentClasses.cancelYes', 'Sí')}
                </motion.button>
                <motion.button
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                  transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
                  onClick={() => { setConfirmCancel(false); setCancelReason(''); }}
                  className="text-[11px] text-slate-600 hover:text-slate-300 min-h-[36px] px-2 rounded-lg hover:bg-white/[0.05] transition-colors duration-150"
                >
                  {t('talentClasses.cancelNo', 'No')}
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                key="trigger"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                onClick={() => setConfirmCancel(true)}
                className="text-[11px] text-slate-400 hover:text-red-400 min-h-[36px] px-2 rounded-lg hover:bg-red-500/[0.06] transition-colors duration-150"
              >
                {t('talentClasses.cancelRequest', 'Cancelar')}
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>

      {confirmCancel && status === 'pending' && (
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder={t('talentClasses.cancelReasonPlaceholder', 'Motivo (opcional)')}
          maxLength={500}
          rows={2}
          className="w-full mt-2 text-[12px] text-slate-300 placeholder:text-slate-600 bg-white/[0.04] border border-white/[0.07] rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:border-white/[0.15] transition-colors duration-150"
        />
      )}

      {/* Pending: remind the talent what class and where to check status */}
      {status === 'pending' && (
        <p className="mt-3 text-[12px] text-slate-500 leading-relaxed">
          {req.class_name
            ? t('talentClasses.pendingTopicHint', { topic: req.class_name })
            : null}
          {' '}{t('talentClasses.pendingStatusHint')}
        </p>
      )}

      {/* Calendar shortcuts + payment status — confirmed only */}
      {status === 'confirmed' && (
        <div className="mt-1">
          {req.meeting_url && (
            <a
              href={req.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 px-4 py-2 rounded-xl transition-colors min-h-[38px] mb-2"
            >
              <Video className="h-4 w-4 shrink-0" />
              {t('talentClasses.joinClass', 'Unirse a la clase')}
            </a>
          )}
          <CalendarActions req={req} />
          <PaymentAction req={req} />
        </div>
      )}

      {/* Completed: link to certificates */}
      {status === 'completed' && (
        <motion.button
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
          onClick={() => navigate('/dashboard/talent')}
          className="inline-flex items-center gap-1.5 mt-3 text-[12px] text-purple-400 hover:text-purple-300 min-h-[36px] -ml-1 px-1 rounded-lg"
          style={{ transition: 'color 150ms ease-out' }}
        >
          <Award className="h-3.5 w-3.5 shrink-0" />
          {t('talentClasses.viewCertificate')}
        </motion.button>
      )}
    </div>
  );
}

function ClassRow({ req, index, autoOpenId }: { req: MyClassRequest; index: number; autoOpenId?: number | null }) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const status = req.status as StatusKey;
  const statusLabel = t(`classInbox.status.${status}`, status);
  const label = req.issuer_organization || req.issuer_wallet;

  // Deep link from the notification bell — open straight to this class.
  useEffect(() => {
    if (autoOpenId === req.id) setOpen(true);
  }, [autoOpenId, req.id]);

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index, 5) * 0.038, ease: EASE }}
      className="border-b border-white/[0.05] last:border-b-0"
    >
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            className="w-full flex items-center gap-3 py-3.5 -mx-2 px-2 rounded-xl hover:bg-white/[0.03] transition-colors duration-150 text-left"
            aria-label={`Ver detalle de la clase con ${label}`}
          >
            <EduAvatar photo={req.issuer_photo} label={label} />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-white truncate leading-snug">
                    {req.issuer_organization
                      ? req.issuer_organization
                      : `${req.issuer_wallet.slice(0, 6)}…${req.issuer_wallet.slice(-4)}`}
                  </p>
                  {req.class_name && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{req.class_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 mt-[3px]">
                  <span className={`h-[6px] w-[6px] rounded-full shrink-0 ${STATUS_DOT[status]}`} />
                  <span className={`text-[11px] font-medium ${STATUS_TEXT[status]}`}>{statusLabel}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[12px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-[11px] w-[11px] shrink-0" />
                  {formatDate(req.requested_date)} · {req.start_time}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-[11px] w-[11px] shrink-0" />
                  {req.duration_minutes} min
                </span>
                {req.hourly_rate_usd && (
                  <PriceTag usdAmount={parseFloat(String(req.hourly_rate_usd))} suffix="/hr" className="text-[12px]" />
                )}
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-slate-600 shrink-0" />
          </button>
        </DialogTrigger>

        <DialogContent className="bg-slate-900/95 backdrop-blur-2xl border-white/[0.08] text-slate-200 rounded-2xl max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <EduAvatar photo={req.issuer_photo} label={label} />
              <div className="min-w-0">
                <DialogTitle className="text-white text-base truncate">
                  {req.issuer_organization
                    ? req.issuer_organization
                    : `${req.issuer_wallet.slice(0, 6)}…${req.issuer_wallet.slice(-4)}`}
                </DialogTitle>
                {req.class_name && (
                  <DialogDescription className="truncate">{req.class_name}</DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-400 -mt-1">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {formatDate(req.requested_date)} · {req.start_time}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {req.duration_minutes} min
            </span>
            {req.hourly_rate_usd && (
              <PriceTag usdAmount={parseFloat(String(req.hourly_rate_usd))} suffix="/hr" className="text-[13px]" />
            )}
          </div>

          <ClassDetail req={req} />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function PendingConfirmationRow({ cert, index }: { cert: PendingConfirmationCertificate; index: number }) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const { mutate: confirm, isPending: isConfirming } = useConfirmCertificate();
  const { mutate: flag, isPending: isFlagging } = useFlagCertificateIssue();
  const [flagging, setFlagging] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index, 5) * 0.038, ease: EASE }}
      className="border-b border-white/[0.05] last:border-b-0 py-3.5"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] font-medium text-white truncate">{cert.title}</span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => confirm(cert.id)}
            disabled={isConfirming}
            className="inline-flex items-center gap-1.5 text-[12px] text-emerald-400 hover:text-emerald-300 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/10 disabled:opacity-40 min-h-[36px]"
          >
            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
            {t('pendingCertConfirmations.confirm', 'Confirmar')}
          </button>
          <button
            onClick={() => setFlagging(v => !v)}
            className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-amber-400 px-2.5 py-1.5 rounded-lg hover:bg-white/5 min-h-[36px]"
          >
            <Flag className="h-3.5 w-3.5 shrink-0" />
            {t('pendingCertConfirmations.report', 'Reportar problema')}
          </button>
        </div>
      </div>
      {flagging && (
        <div className="mt-2 flex flex-col gap-1.5">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('pendingCertConfirmations.reasonPlaceholder', '¿Qué está mal?')}
            rows={2}
            maxLength={500}
            className="w-full text-[12px] text-slate-300 placeholder:text-slate-600 bg-white/[0.04] border border-white/[0.07] rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:border-white/[0.15]"
          />
          <button
            onClick={() => { flag({ id: cert.id, reason: reason.trim() || undefined }); setFlagging(false); setReason(''); }}
            disabled={isFlagging}
            className="self-start text-[12px] font-medium text-amber-400 hover:text-amber-300 min-h-[36px] px-2 disabled:opacity-40"
          >
            {t('pendingCertConfirmations.submitReport', 'Enviar reporte')}
          </button>
        </div>
      )}
    </motion.div>
  );
}

function SectionLabel({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 pb-1 pt-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
        {label}
      </span>
      {count != null && count > 0 && (
        <span className="text-[10px] font-bold text-slate-700 tabular-nums">{count}</span>
      )}
    </div>
  );
}

const HISTORY_PAGE_SIZE = 5;

export default function TalentClasses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestIdParam = searchParams.get('requestId');
  const openRequestId = requestIdParam ? Number(requestIdParam) : null;
  const { data: requests, isPending } = useMyClassRequests();
  const { data: pendingConfirmations = [] } = usePendingCertificateConfirmations();
  const [historyVisible, setHistoryVisible] = useState(HISTORY_PAGE_SIZE);

  const active  = requests?.filter(r => r.status === 'pending' || r.status === 'confirmed') ?? [];
  const history = requests?.filter(r => r.status === 'completed' || r.status === 'cancelled') ?? [];

  // Deep link from the bell — clear the param once consumed, and make sure a
  // paginated-away history item is actually in the visible slice.
  useEffect(() => {
    if (!openRequestId) return;
    setSearchParams({}, { replace: true });
    const idx = history.findIndex(r => r.id === openRequestId);
    if (idx >= 0 && idx >= historyVisible) {
      setHistoryVisible(idx + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRequestId, requests]);

  const historySlice = history.slice(0, historyVisible);
  const hasMoreHistory = historyVisible < history.length;
  const pendingCount   = requests?.filter(r => r.status === 'pending').length ?? 0;
  const confirmedCount = requests?.filter(r => r.status === 'confirmed').length ?? 0;
  const hasAny = (requests?.length ?? 0) > 0;

  return (
    <Layout>
      <div className="min-h-screen font-body text-slate-200">
        {/* Header */}
        <div
          className="sticky top-0 z-20 border-b border-white/[0.06]"
          style={{
            backgroundColor: 'oklch(0.11 0.012 280 / 0.92)',
            backdropFilter: 'blur(20px) saturate(1.4)',
          }}
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
            <motion.button
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
              onClick={() => navigate('/dashboard/talent')}
              className="h-9 w-9 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/[0.06] shrink-0"
              style={{ transition: 'color 150ms ease-out, background-color 150ms ease-out' }}
              aria-label="Volver al dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </motion.button>

            <div className="flex-1 min-w-0">
              <h1 className="font-title text-[15px] font-semibold text-white leading-none truncate">
                {t('talentClasses.title')}
              </h1>
              {confirmedCount > 0 && (
                <p className="text-[11px] text-emerald-500 mt-0.5 leading-none">
                  {confirmedCount} {t('talentClasses.confirmed')}
                </p>
              )}
            </div>

            <motion.button
              whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
              transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
              onClick={() => navigate('/calendar')}
              className="h-9 w-9 flex items-center justify-center rounded-full text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
              aria-label="Ver calendario"
            >
              <Calendar className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        <motion.main
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="max-w-2xl mx-auto px-4 sm:px-6 pt-3 pb-28"
        >
          {/* Loading */}
          {isPending && (
            <div>
              {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          )}

          {/* Empty */}
          {!isPending && !hasAny && (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="mt-24 flex flex-col items-center text-center gap-3"
            >
              <CalendarDays className="h-7 w-7 text-slate-700" />
              <div className="space-y-1 max-w-[220px]">
                <p className="text-sm font-medium text-slate-400">{t('talentClasses.empty')}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{t('talentClasses.emptyHint')}</p>
              </div>
              <button
                onClick={() => navigate('/educators')}
                className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 mt-1 min-h-[44px]"
                style={{ transition: 'color 150ms ease-out' }}
              >
                {t('talentClasses.discover')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* Pending certificate confirmations — step 12 of the class-payment workflow */}
          {pendingConfirmations.length > 0 && (
            <section className="mb-5">
              <SectionLabel
                label={t('pendingCertConfirmations.title', 'Confirma tus clases')}
                count={pendingConfirmations.length}
              />
              <AnimatePresence mode="popLayout">
                {pendingConfirmations.map((cert, i) => (
                  <PendingConfirmationRow key={cert.id} cert={cert} index={i} />
                ))}
              </AnimatePresence>
            </section>
          )}

          {/* Active classes */}
          {!isPending && active.length > 0 && (
            <section className="mb-5">
              <SectionLabel
                label={t('talentClasses.sectionActive')}
                count={pendingCount || undefined}
              />
              <AnimatePresence mode="popLayout">
                {active.map((req, i) => (
                  <ClassRow key={req.id} req={req} index={i} autoOpenId={openRequestId} />
                ))}
              </AnimatePresence>
            </section>
          )}

          {/* History */}
          {!isPending && history.length > 0 && (
            <section>
              <SectionLabel label={t('talentClasses.sectionHistory')} count={history.length} />
              <AnimatePresence mode="popLayout">
                {historySlice.map((req, i) => (
                  <ClassRow key={req.id} req={req} index={i} autoOpenId={openRequestId} />
                ))}
              </AnimatePresence>

              {hasMoreHistory && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                  transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
                  onClick={() => setHistoryVisible(v => v + HISTORY_PAGE_SIZE)}
                  className="w-full mt-2 py-2.5 text-[12px] text-slate-500 hover:text-slate-300 rounded-lg hover:bg-white/[0.04] transition-colors duration-150"
                >
                  {t('talentClasses.showMore', { count: Math.min(HISTORY_PAGE_SIZE, history.length - historyVisible) })}
                </motion.button>
              )}
            </section>
          )}
        </motion.main>
      </div>
    </Layout>
  );
}

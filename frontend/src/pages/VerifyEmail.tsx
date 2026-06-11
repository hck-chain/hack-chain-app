import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Loader2, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { appKit } from '@/config/walletConfig';
import { CoverAnimation } from '@/components/CoverAnimation/CoverAnimation';

type Status = 'idle' | 'verifying' | 'success' | 'error' | 'expired';

// Countdown bar that drains in 3s (used in success state)
function CountdownBar() {
  return (
    <div className="mt-6 h-0.5 w-full overflow-hidden rounded-full bg-white/5">
      <motion.div
        className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-blue-400"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 3, ease: 'linear' }}
      />
    </div>
  );
}

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.get<{ message: string }>(`/api/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch((err: Error) => {
        const msg = err.message || '';
        if (msg.toLowerCase().includes('expir')) {
          setStatus('expired');
        } else {
          setStatus('error');
          setErrorMsg(msg);
        }
      });
  }, [token]);

  useEffect(() => {
    if (status !== 'success') return;
    const timer = setTimeout(() => navigate('/educator/dashboard'), 3000);
    return () => clearTimeout(timer);
  }, [status, navigate]);

  // Poll GET /api/auth/me every 4s while idle — detects when the user
  // clicks the verification link from another device/browser tab.
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (status !== 'idle') {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const result = await api.get<{ user: { email_verified?: boolean } }>('/api/auth/me');
        if (result?.user?.email_verified) {
          clearInterval(pollRef.current!);
          setStatus('success');
        }
      } catch {
        // session expired or network error — stop polling silently
        clearInterval(pollRef.current!);
      }
    }, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [status]);

  async function handleResend() {
    setResendLoading(true);
    setResendError('');
    try {
      await api.post('/api/auth/resend-verification', {});
      setResendDone(true);
    } catch (err) {
      setResendError(err instanceof Error ? err.message : 'No se pudo enviar el email. Intentá de nuevo.');
    } finally {
      setResendLoading(false);
    }
  }

  function handleBackToHome() {
    logout();
    try { appKit.disconnect(); } catch (_) {}
    navigate('/login');
  }

  return (
    <div className="relative min-h-screen bg-[#07070f] flex flex-col items-center justify-center px-4 py-12">
      {/* Same background animation as EditEducatorProfile */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <CoverAnimation />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="relative bg-[#0a0a18]/90 border border-white/5 rounded-2xl overflow-hidden shadow-xl shadow-black/60 backdrop-blur-sm">
          {/* Top gradient bar */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-500/80 to-transparent" />

          <div className="p-8">
            <AnimatePresence mode="wait">

              {/* ── IDLE ── */}
              {status === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600/15 to-indigo-600/15 border border-purple-500/15">
                    <img src="/favicon.ico" alt="HackChain" className="h-9 w-9 object-contain" />
                  </div>

                  <h1 className="mb-2 text-xl font-bold text-white tracking-tight">
                    {t('verifyEmail.title')}
                  </h1>
                  <p className="mb-1 text-xs font-medium uppercase tracking-widest text-purple-400/70">
                    {t('verifyEmail.stepLabel')}
                  </p>

                  <div className="my-6 border-t border-white/5" />

                  <p className="mb-2 text-sm leading-relaxed text-slate-400">
                    {t('verifyEmail.description')}
                  </p>
                  <p className="mb-8 text-xs text-slate-600">
                    {t('verifyEmail.validFor')} <span className="text-slate-400 font-medium">{t('verifyEmail.validHours')}</span>.
                  </p>

                  {user && !resendDone && (
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl h-11 shadow-lg shadow-purple-900/30"
                      disabled={resendLoading}
                      onClick={handleResend}
                    >
                      {resendLoading
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('verifyEmail.sending')}</>
                        : <><Mail className="mr-2 h-4 w-4" />{t('verifyEmail.sendBtn')}</>
                      }
                    </Button>
                  )}

                  {resendDone && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400 text-left">
                      <p>{t('verifyEmail.sent')}</p>
                      {user?.email && (
                        <p className="mt-1 text-xs text-emerald-300/70 font-mono break-all">
                          {user.email}
                        </p>
                      )}
                    </div>
                  )}

                  {resendError && (
                    <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                      {resendError}
                    </div>
                  )}

                  <button
                    onClick={handleBackToHome}
                    className="mt-6 text-xs text-slate-600 hover:text-slate-400 transition-colors underline underline-offset-4"
                  >
                    {t('verifyEmail.useOtherAccount')}
                  </button>
                </motion.div>
              )}

              {/* ── VERIFYING ── */}
              {status === 'verifying' && (
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-4"
                >
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600/20 to-blue-600/20 border border-indigo-500/20">
                    <Loader2 className="h-7 w-7 text-indigo-300 animate-spin" />
                  </div>
                  <h1 className="mb-2 text-xl font-bold text-white tracking-tight">{t('verifyEmail.verifyingTitle')}</h1>
                  <p className="text-sm text-slate-500">{t('verifyEmail.verifyingDesc')}</p>
                </motion.div>
              )}

              {/* ── SUCCESS ── */}
              {status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                    className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/25"
                  >
                    <ShieldCheck className="h-7 w-7 text-emerald-400" />
                  </motion.div>

                  <h1 className="mb-2 text-xl font-bold text-white tracking-tight">
                    {t('verifyEmail.successTitle')}
                  </h1>
                  <p className="mb-1 text-xs font-medium uppercase tracking-widest text-emerald-400/70">
                    {t('verifyEmail.successLabel')}
                  </p>

                  <div className="my-6 border-t border-white/5" />

                  <p className="text-sm text-slate-400">
                    {t('verifyEmail.successDesc')}
                  </p>

                  <CountdownBar />
                </motion.div>
              )}

              {/* ── EXPIRED ── */}
              {status === 'expired' && (
                <motion.div
                  key="expired"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/20">
                    <XCircle className="h-7 w-7 text-amber-400" />
                  </div>

                  <h1 className="mb-2 text-xl font-bold text-white tracking-tight">{t('verifyEmail.expiredTitle')}</h1>
                  <p className="mb-1 text-xs font-medium uppercase tracking-widest text-amber-400/70">
                    {t('verifyEmail.expiredLabel')}
                  </p>

                  <div className="my-6 border-t border-white/5" />

                  <p className="mb-8 text-sm text-slate-400">
                    {t('verifyEmail.expiredDesc')}
                  </p>

                  {user && !resendDone && (
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl h-11"
                      disabled={resendLoading}
                      onClick={handleResend}
                    >
                      {resendLoading
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('verifyEmail.sending')}</>
                        : <><RefreshCw className="mr-2 h-4 w-4" />{t('verifyEmail.requestNew')}</>
                      }
                    </Button>
                  )}

                  {resendDone && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400 text-left">
                      <p>{t('verifyEmail.sent')}</p>
                      {user?.email && (
                        <p className="mt-1 text-xs text-emerald-300/70 font-mono break-all">
                          {user.email}
                        </p>
                      )}
                    </div>
                  )}

                  {resendError && (
                    <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                      {resendError}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── ERROR ── */}
              {status === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600/20 to-rose-600/20 border border-red-500/20">
                    <XCircle className="h-7 w-7 text-red-400" />
                  </div>

                  <h1 className="mb-2 text-xl font-bold text-white tracking-tight">{t('verifyEmail.errorTitle')}</h1>
                  <p className="mb-1 text-xs font-medium uppercase tracking-widest text-red-400/70">
                    {t('verifyEmail.errorLabel')}
                  </p>

                  <div className="my-6 border-t border-white/5" />

                  <p className="mb-8 text-sm text-slate-400">
                    {errorMsg || t('verifyEmail.errorDesc')}
                  </p>

                  <Button
                    variant="outline"
                    className="border-white/10 text-slate-300 hover:bg-white/5 rounded-xl h-11"
                    onClick={handleBackToHome}
                  >
                    {t('verifyEmail.backToLogin')}
                  </Button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Bottom gradient bar */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
        </div>
      </motion.div>
    </div>
  );
}

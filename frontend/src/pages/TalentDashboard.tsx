import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Award, Briefcase, Wallet, LogOut, ChevronDown, ChevronRight, ExternalLink, GraduationCap, Users, Mail, Copy, Check, Bell, CheckCircle, XCircle, Flag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { appKit } from '@/config/walletConfig';
import { LanguageToggle } from '@/components/LanguageToggle';
import { DeleteAccountModal } from '@/components/DeleteAccountModal/DeleteAccountModal';
import { useDeleteStudentAccount } from '@/hooks/useDeleteStudentAccount';
import { useFeaturedEducators } from '@/hooks/useFeaturedEducators';
import FeaturedEducatorCard from '@/components/FeaturedEducatorCard/FeaturedEducatorCard';

import Layout from '@/components/Layout';
import EducatorMiniCard from '@/components/EducatorMiniCard/EducatorMiniCard';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useTalentCertificates } from '@/hooks/useTalentCertificates';
import { useTalentEducators } from '@/hooks/useTalentEducators';
import { api } from '@/services/api';
import type { TalentInfo } from '@/types/dashboard';
import { ReferralsSection } from '@/components/dashboard/ReferralsSection';
import { useMyClassRequests, type MyClassRequest } from '@/hooks/useMyClassRequests';

const HackChainLogo = '/images/logoHackchain2.webp';

function resolveImage(url?: string): string {
  if (!url) return '';
  return url.startsWith('ipfs://')
    ? url.replace('ipfs://', 'https://ipfs.io/ipfs/')
    : url;
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function CertificateSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
      <Skeleton className="w-full aspect-[3/2] bg-white/5" />
      <div className="p-2 flex justify-center">
        <div className="h-6 w-24 bg-white/[0.04] rounded-lg" />
      </div>
    </div>
  );
}

function EducatorSkeleton() {
  return (
    <div className="flex items-center gap-3.5 py-4 border-b border-white/[0.05] px-2 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-white/[0.05] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-28 bg-white/[0.05] rounded-full" />
        <div className="h-2.5 w-20 bg-white/[0.04] rounded-full" />
      </div>
      <div className="h-3 w-5 bg-white/[0.04] rounded-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-sections
// ---------------------------------------------------------------------------

function TrayectoriaSection({ wallet }: { wallet: string }) {
  const { t } = useTranslation();
  const { data: certificates = [], isPending } = useTalentCertificates(wallet);

  const viewOnOpenSea = (contract: string, identifier: string) => {
    window.open(
      `https://opensea.io/assets/polygon/${contract}/${identifier}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  if (isPending) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[...Array(4)].map((_, i) => <CertificateSkeleton key={i} />)}
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Award className="h-10 w-10 mb-3 opacity-30" />
        <p className="font-body text-base">{t('talentDashboard.noCertificates')}</p>
        <p className="font-body text-sm mt-1 text-center">{t('talentDashboard.noCertificatesHint')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {certificates.map((cert, idx) => (
        <motion.div
          key={`${cert.contract}-${cert.identifier}`}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.35, delay: Math.min(idx * 0.06, 0.3) }}
          className="flex flex-col rounded-xl overflow-hidden bg-slate-900/20 border border-white/10 hover:border-white/20 hover:scale-[1.02] transition-[transform,border-color] duration-300"
        >
          <div className="w-full aspect-[3/2] flex items-center justify-center bg-black/30 overflow-hidden">
            <img
              src={resolveImage(cert.original_image_url || cert.display_image_url || cert.image_url)}
              alt={cert.name || `Certificate ${cert.identifier}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="p-2 flex justify-center">
            <button
              onClick={() => viewOnOpenSea(cert.contract, cert.identifier)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow transition-[transform,opacity] duration-200 active:scale-95"
            >
              <img
                src="https://static.seadn.io/logos/Logomark-White.png"
                alt="OpenSea"
                className="h-3 w-3"
                loading="lazy"
              />
              {t('talentDashboard.viewOnOpenSea')}
              <ExternalLink className="h-2.5 w-2.5 opacity-70" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function FormacionSection({ wallet }: { wallet: string }) {
  const { t } = useTranslation();
  const { data: educators = [], isPending } = useTalentEducators(wallet);

  if (isPending) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <EducatorSkeleton key={i} />)}
      </div>
    );
  }

  if (educators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <GraduationCap className="h-10 w-10 mb-3 opacity-30" />
        <p className="font-body text-base">{t('talentDashboard.noEducators')}</p>
        <p className="font-body text-sm mt-1 text-center">{t('talentDashboard.noEducatorsHint')}</p>
      </div>
    );
  }

  return (
    <div>
      {educators.map((educator) => (
        <EducatorMiniCard key={educator.wallet_address} educator={educator} />
      ))}
    </div>
  );
}

function DiscoverSkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.03] animate-pulse">
      <div className="w-full aspect-[4/5] bg-white/[0.06]" />
      <div className="px-3 py-2.5 space-y-1.5">
        <div className="h-2.5 w-20 bg-white/[0.06] rounded-full" />
      </div>
    </div>
  );
}

function DescubrirSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isPending } = useFeaturedEducators(4);
  const educators = data?.educators ?? [];

  if (isPending) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {[...Array(4)].map((_, i) => <DiscoverSkeletonCard key={i} />)}
      </div>
    );
  }

  if (educators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <img src="/icons/talentsPlattform.avif" className="h-10 w-10 object-contain opacity-25 mt-0.5" />
        <p className="font-body text-sm mt-3">{t('discover.noEducators')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {educators.map((educator) => (
          <FeaturedEducatorCard key={educator.wallet_address} educator={educator} />
        ))}
      </div>
      <button
        onClick={() => navigate('/educators')}
        className="text-xs text-slate-600 hover:text-slate-300 min-h-[44px] flex items-center gap-1"
        style={{ transition: 'color 150ms ease-out' }}
      >
        {t('discover.viewAll')}
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notification bell — class request status updates
// ---------------------------------------------------------------------------

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const STATUS_LABEL_KEY: Record<Exclude<MyClassRequest['status'], 'pending'>, string> = {
  confirmed: 'talentDashboard.bellStatusConfirmed',
  cancelled:  'talentDashboard.bellStatusCancelled',
  completed:  'talentDashboard.bellStatusCompleted',
};

const STATUS_DOT: Record<Exclude<MyClassRequest['status'], 'pending'>, string> = {
  confirmed: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]',
  cancelled:  'bg-slate-500',
  completed:  'bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.7)]',
};

const STATUS_LABEL_COLOR: Record<Exclude<MyClassRequest['status'], 'pending'>, string> = {
  confirmed: 'text-emerald-400',
  cancelled:  'text-slate-400',
  completed:  'text-purple-400',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function TalentNotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { data, isPending } = useMyClassRequests();

  // Timestamp of when the bell was last opened — used to compute unread count
  const [lastOpenedTs, setLastOpenedTs] = useState<number>(() => {
    const stored = localStorage.getItem('talentBellLastOpened');
    return stored ? new Date(stored).getTime() : 0;
  });

  // Snapshot captured at the moment of opening — used to highlight new items while panel is visible
  const [panelOpenedAt, setPanelOpenedAt] = useState<number>(lastOpenedTs);

  const all = data ?? [];

  const updates = all
    .filter((r): r is MyClassRequest & { status: 'confirmed' | 'cancelled' | 'completed' } =>
      r.status !== 'pending'
    )
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6);

  const unreadCount = all.filter(
    r => r.status !== 'pending' && new Date(r.updated_at).getTime() > lastOpenedTs
  ).length;

  function handleOpenChange(open: boolean) {
    if (!open) return;
    // Capture the pre-open threshold for per-item "new" highlighting
    setPanelOpenedAt(lastOpenedTs);
    // Mark everything as read
    const now = Date.now();
    localStorage.setItem('talentBellLastOpened', new Date(now).toISOString());
    setLastOpenedTs(now);
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <motion.button
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
          className="relative flex items-center justify-center text-slate-300 hover:text-white min-h-[36px] w-9 rounded-lg"
          style={{ transition: 'color 150ms ease-out' }}
          aria-label={t('talentDashboard.bellAriaLabel')}
        >
          <Bell className="h-[18px] w-[18px] shrink-0" />
          <AnimatePresence mode="popLayout">
            {unreadCount > 0 && (
              <motion.span
                key={unreadCount}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={shouldReduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', duration: 0.25, bounce: 0.3 }
                }
                className="absolute top-1 right-0.5 min-w-[16px] h-[16px] px-[3px] rounded-full bg-red-500 text-white text-[10px] font-bold tabular-nums leading-[16px] text-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 bg-slate-900/90 backdrop-blur-2xl border-white/[0.08] shadow-[0_0_40px_rgba(168,85,247,0.12)] rounded-2xl overflow-hidden"
        align="end"
        sideOffset={8}
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute top-0 right-0 w-32 h-32 bg-purple-500/[0.07] rounded-full blur-[40px]" aria-hidden="true" />

        {/* Header */}
        <div className="relative z-10 px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t('talentDashboard.bellTitle')}
          </p>
          <AnimatePresence mode="popLayout">
            {unreadCount > 0 && (
              <motion.span
                key="header-badge"
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', duration: 0.22, bounce: 0.2 }}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold tabular-nums"
              >
                {unreadCount} {unreadCount === 1 ? 'nuevo' : 'nuevos'}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Skeleton */}
        {isPending && (
          <div className="relative z-10 px-4 py-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05, duration: 0.2, ease: EASE_OUT }}
                className="flex gap-3 py-3.5 border-b border-white/[0.04] last:border-b-0"
              >
                <div className="h-2 w-2 rounded-full bg-white/[0.06] shrink-0 mt-1.5 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-36 bg-white/[0.05] rounded-full animate-pulse" />
                  <div className="h-2.5 w-24 bg-white/[0.04] rounded-full animate-pulse" />
                </div>
                <div className="h-2.5 w-8 bg-white/[0.04] rounded-full animate-pulse shrink-0" />
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isPending && updates.length === 0 && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="relative z-10 flex flex-col items-center justify-center py-10 px-4 text-center"
          >
            <motion.div
              initial={shouldReduceMotion ? false : { scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.06, ease: EASE_OUT }}
            >
              <Bell className="h-7 w-7 text-slate-700 mb-2" />
            </motion.div>
            <p className="text-xs text-slate-500">{t('talentDashboard.bellEmpty')}</p>
          </motion.div>
        )}

        {/* Directory-pattern list — no card boxes, rows separated by border */}
        {!isPending && updates.length > 0 && (
          <div className="relative z-10 px-4">
            {updates.map((req, i) => {
              const isNew = new Date(req.updated_at).getTime() > panelOpenedAt;
              const dotClass = STATUS_DOT[req.status];
              const labelColor = STATUS_LABEL_COLOR[req.status];
              const labelKey = STATUS_LABEL_KEY[req.status];

              return (
                <motion.div
                  key={req.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i, 5) * 0.04, ease: EASE_OUT }}
                  className={`-mx-4 px-4 py-3.5 border-b border-white/[0.05] last:border-b-0 ${isNew ? 'bg-white/[0.02]' : ''}`}
                  style={{ transition: 'background-color 200ms ease-out' }}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Status dot */}
                    <div className={`mt-[5px] h-2 w-2 rounded-full shrink-0 ${dotClass}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`text-xs font-semibold leading-tight ${labelColor}`}>
                          {t(labelKey)}
                        </p>
                        <span className="text-[10px] text-slate-600 tabular-nums shrink-0">
                          {timeAgo(req.updated_at)}
                        </span>
                      </div>
                      {req.class_name && (
                        <p className="text-[11px] text-slate-300 truncate mt-0.5">{req.class_name}</p>
                      )}
                      {req.issuer_organization && (
                        <p className="text-[11px] text-slate-500 truncate">
                          con {req.issuer_organization}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="relative z-10 px-4 py-3 border-t border-white/[0.06]">
          <motion.button
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
            onClick={() => navigate('/dashboard/talent/classes')}
            className="w-full text-left text-xs text-slate-500 hover:text-purple-400 flex items-center justify-between"
            style={{ transition: 'color 150ms ease-out' }}
          >
            <span>{t('talentDashboard.bellViewAll')}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          </motion.button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

const TalentDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [talent, setTalent] = useState<TalentInfo | null>(null);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { isAdmin } = useAdminAccess();

  const { logout } = useAuth();
  const deleteAccount = useDeleteStudentAccount();

  const handleDeleteAccount = () => {
    if (!talent?.wallet_address) return;
    deleteAccount.mutate(talent.wallet_address, {
      onSuccess: () => {
        logout();
        queryClient.clear();
        try { appKit.disconnect(); } catch (_) { }
        toast({ title: t('deleteAccount.successTitle', 'Account deleted'), description: t('deleteAccount.successDesc', 'Your account has been permanently deleted.') });
        navigate('/');
      },
      onError: (error) => {
        setShowDeleteModal(false);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      },
    });
  };

  const handleLogout = async () => {
    logout();
    queryClient.clear();
    try { await appKit.disconnect(); } catch (_) { }
    toast({ title: t('dashboard.logoutTitle'), description: t('dashboard.logoutDesc') });
    window.location.href = '/login';
  };

  useSessionTimeout({
    onExpired: () => {
      toast({
        title: t('talentDashboard.sessionExpiredTitle'),
        description: t('talentDashboard.sessionExpiredDesc'),
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    api
      .get<{ user: { wallet_address: string; name?: string; email?: string }; modelName: string }>(
        '/api/auth/me'
      )
      .then((data) => {
        setTalent({
          wallet_address: data.user.wallet_address,
          name: data.user.name,
          email: data.user.email,
          role: data.modelName || 'Talent',
        });
      })
      .catch(() => {
        toast({
          title: 'Error',
          description: t('talentDashboard.errorLoadUser'),
          variant: 'destructive',
        });
      });
  }, [toast]);

  if (!talent) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
        </div>
      </Layout>
    );
  }

  return (
    <>
      <DeleteAccountModal
        open={showDeleteModal}
        organizationName={talent.name ?? talent.wallet_address.slice(0, 6)}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
        isPending={deleteAccount.isPending}
      />
      <Layout>
      <div className="min-h-screen font-body text-slate-200">
        <motion.main
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="relative z-10 px-4 sm:px-6 md:px-10 pt-5 sm:pt-8 md:pt-10 pb-20 max-w-[1600px] mx-auto"
        >
          {/* ── Header ── */}
          <header className="mb-5 md:mb-8 grid grid-cols-2 md:grid-cols-3 items-center gap-3 md:gap-4">
            <div className="flex flex-col">
              <p className="font-title text-[10px] sm:text-xs uppercase tracking-[0.22em] text-white/35 font-bold mb-1.5 sm:mb-3">
                {t('talentDashboard.talentFallback')}
              </p>
              <h1 className="font-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.02] mb-1 sm:mb-2">
                <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(168,85,247,0.55)]">
                  {t('talentDashboard.title')}
                </span>
              </h1>
              <p className="hidden sm:block font-body text-base text-white/50 font-medium">
                {t('talentDashboard.subtitle')}
              </p>
            </div>

            <div className="hidden md:flex justify-center">
              <img src={HackChainLogo} alt="HackChain" className="h-16 md:h-20 object-contain" />
            </div>

            <div className="flex justify-end items-center gap-2">
              <LanguageToggle />
              <TalentNotificationBell />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all max-w-full"
                  >
                    <div className="flex flex-row items-baseline gap-1 overflow-hidden">
                      <span className="hidden sm:inline text-xs text-slate-400 whitespace-nowrap">{t('talentDashboard.welcome')}</span>
                      <span className="text-sm font-bold text-white truncate max-w-[100px] sm:max-w-[140px]">
                        {talent.name || t('talentDashboard.talentFallback')}
                      </span>
                    </div>
                    <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-tr from-purple-500 to-fuchsia-500 flex items-center justify-center">
                      <img src="/icons/talentExperience.avif" className="h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  className="w-72 p-0 bg-slate-900/80 backdrop-blur-2xl border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.15)] rounded-2xl overflow-hidden relative"
                  align="end"
                  sideOffset={8}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none" />
                  <div className="p-5 space-y-4 relative z-10">
                    <div className="flex items-center gap-3 pb-4 border-b border-purple-500/20">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-purple-500 to-fuchsia-500 flex items-center justify-center shrink-0">
                        <img src="/icons/talentExperience.avif" className="h-7 w-7 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-title text-sm font-bold text-white truncate">{talent.name || t('talentDashboard.talentFallback')}</p>
                        <p className="text-xs text-fuchsia-400 font-medium">{t('talentDashboard.talentFallback')}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-colors">
                        <img src="/icons/maletinNeon.avif" className="h-5 w-6 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1">{t('talentDashboard.roleLabel')}</p>
                          <p className="text-sm text-slate-200">{t('talentDashboard.talentFallback')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-colors">
                        <img src="/icons/wallet.avif" className="h-5 w-6 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1">{t('talentDashboard.walletLabel')}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-slate-200 font-mono">
                              {talent.wallet_address.slice(0, 6)}…{talent.wallet_address.slice(-4)}
                            </p>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(talent.wallet_address);
                                setCopiedWallet(true);
                                setTimeout(() => setCopiedWallet(false), 2000);
                              }}
                              className="shrink-0 text-white/30 hover:text-fuchsia-400 transition-colors"
                              title="Copiar wallet"
                            >
                              {copiedWallet
                                ? <Check className="h-3.5 w-3.5 text-emerald-400" />
                                : <Copy className="h-3.5 w-3.5" />
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                      {talent.email && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-colors">
                          <img src="/icons/mail.avif" className="h-8 w-8 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1">{t('talentDashboard.emailLabel', 'Correo')}</p>
                            <p className="text-sm text-slate-200 font-mono">
                              {(() => {
                                const [name, domain] = talent.email.split('@');
                                return name && domain ? `${name.slice(0, 2)}***@${domain}` : talent.email;
                              })()}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => navigate('/dashboard/talent/classes')}
                        className="w-full text-left flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-colors"
                      >
                        <img src="/icons/libroNeon.avif" className="h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1">{t('talentDashboard.classesLabel')}</p>
                          <p className="text-sm text-slate-200">{t('talentDashboard.classesHint')}</p>
                        </div>
                      </button>

                      {isAdmin && (
                        <Link to="/admin" className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-colors">
                          <img src="/icons/escudoNeon.avif" className="h-5 w-6 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1">Admin</p>
                            <p className="text-sm text-slate-200">Panel de Administración</p>
                          </div>
                        </Link>
                      )}
                    </div>

                    <div className="pt-3 border-t border-purple-500/20 space-y-2">
                      <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30"
                      >
                        <img src="/icons/logout.avif" className="h-5 w-5 mr-2 object-contain drop-shadow-md" />
                        {t('talentDashboard.closeSession')}
                      </Button>
                      <Button
                        onClick={() => setShowDeleteModal(true)}
                        variant="ghost"
                        className="w-full text-slate-500 hover:text-red-400 hover:bg-red-500/5 text-xs"
                      >
                        <img src="/icons/delete.avif" className="h-5 w-5 mr-2 object-contain drop-shadow-md" />
                        {t('deleteAccount.deleteBtn')}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </header>

          {/* ── Mobile: Tabs ── */}
          <div className="block md:hidden">
            <Tabs defaultValue="trayectoria">
              <TabsList className="w-full flex bg-transparent rounded-none p-0 h-auto border-b border-white/[0.08] mb-6 gap-0">
                {[
                  { value: 'trayectoria', icon: Award,         labelKey: 'talentDashboard.tabTrayectoria' },
                  { value: 'formacion',   icon: GraduationCap, labelKey: 'talentDashboard.tabFormacion' },
                  { value: 'descubrir',   icon: Users,         labelKey: 'talentDashboard.sectionDescubrir' },
                ].map(({ value, icon: Icon, labelKey }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="flex-1 flex items-center justify-center gap-1.5 px-1 pb-3 rounded-none bg-transparent shadow-none text-slate-500 border-b-2 border-transparent -mb-px data-[state=active]:border-purple-500 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs sm:text-sm font-medium transition-colors min-h-[44px]"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{t(labelKey)}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="trayectoria">
                <TrayectoriaSection wallet={talent.wallet_address} />
                <ReferralsSection />
              </TabsContent>
              <TabsContent value="formacion">
                <FormacionSection wallet={talent.wallet_address} />
              </TabsContent>
              <TabsContent value="descubrir">
                <DescubrirSection />
              </TabsContent>
            </Tabs>
          </div>

          {/* ── Desktop: Two columns ── */}
          <div className="hidden md:grid md:grid-cols-[minmax(260px,300px)_1fr] gap-8">
            <aside className="rounded-3xl border border-white/[0.07] p-5">
              <h2 className="font-title text-[10px] uppercase tracking-[0.22em] text-white/35 font-bold mb-5 flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-purple-400/60" />
                {t('talentDashboard.sectionFormacion')}
              </h2>
              <FormacionSection wallet={talent.wallet_address} />
            </aside>

            <section className="rounded-3xl border border-white/[0.07] p-5">
              <h2 className="font-title text-[10px] uppercase tracking-[0.22em] text-white/35 font-bold mb-5 flex items-center gap-2">
                <img src="/icons/medalla.avif" className="h-3.5 w-3.5 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                {t('talentDashboard.sectionTrayectoria')}
              </h2>
              <TrayectoriaSection wallet={talent.wallet_address} />
            </section>
          </div>

          <div className="hidden md:block">
            <ReferralsSection />
          </div>

          {/* ── Descubrir Educadores — solo desktop (mobile lo tiene en tabs) ── */}
          <div className="hidden md:block mt-8">
            <p className="font-title text-[10px] uppercase tracking-[0.22em] text-white/35 font-bold mb-5 flex items-center gap-2">
              <img src="/icons/talentsPlattform.avif" className="h-3.5 w-8 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
              {t('talentDashboard.sectionDescubrir')}
            </p>
            <DescubrirSection />
          </div>
        </motion.main>
      </div>
    </Layout>
    </>
  );
};

export default TalentDashboard;

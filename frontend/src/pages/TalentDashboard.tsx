import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Award, Briefcase, Wallet, LogOut, ChevronDown, ExternalLink, GraduationCap, Users, Mail, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { appKit } from '@/config/walletConfig';
import { LanguageToggle } from '@/components/LanguageToggle';

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
    <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10">
      <Skeleton className="w-full aspect-[4/3] bg-white/5" />
    </div>
  );
}

function EducatorSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
      <Skeleton className="h-11 w-11 rounded-full bg-white/5 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-32 bg-white/5" />
        <Skeleton className="h-3 w-24 bg-white/5" />
        <Skeleton className="h-3 w-40 bg-white/5" />
      </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {certificates.map((cert, idx) => (
        <motion.div
          key={`${cert.contract}-${cert.identifier}`}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.35, delay: Math.min(idx * 0.06, 0.3) }}
          className="flex flex-col rounded-2xl overflow-hidden bg-slate-900/20 border border-white/10 hover:border-white/20 hover:scale-[1.01] transition-[transform,border-color] duration-300"
        >
          <div className="w-full flex items-center justify-center bg-black/30">
            <img
              src={resolveImage(cert.original_image_url || cert.display_image_url || cert.image_url)}
              alt={cert.name || `Certificate ${cert.identifier}`}
              className="w-full h-auto object-contain"
              loading="lazy"
            />
          </div>
          <div className="p-3 flex justify-center">
            <button
              onClick={() => viewOnOpenSea(cert.contract, cert.identifier)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition-[transform,opacity] duration-200 active:scale-95"
            >
              <img
                src="https://static.seadn.io/logos/Logomark-White.png"
                alt="OpenSea"
                className="h-4 w-4"
                loading="lazy"
              />
              {t('talentDashboard.viewOnOpenSea')}
              <ExternalLink className="h-3 w-3 opacity-70" />
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
    <div className="space-y-3">
      {educators.map((educator) => (
        <EducatorMiniCard key={educator.wallet_address} educator={educator} />
      ))}
    </div>
  );
}

function DescubrirSection() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500 rounded-3xl border border-dashed border-white/10">
      <img src="/icons/talentsPlattform.avif" className="h-10 w-10 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
      <p className="font-body text-base">{t('talentDashboard.sectionDescubrir')}</p>
      <p className="font-body text-sm mt-1">{t('talentDashboard.discoverComingSoon')}</p>
    </div>
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
  const { isAdmin } = useAdminAccess();

  const { logout } = useAuth();

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
    <Layout>
      <div className="min-h-screen font-body text-slate-200">
        <motion.main
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="relative z-10 px-4 sm:px-6 md:px-10 pt-10 pb-20 max-w-[1600px] mx-auto"
        >
          {/* ── Header ── */}
          <header className="mb-8 grid grid-cols-2 md:grid-cols-3 items-center gap-4">
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
                          <p className="text-sm text-slate-200">{talent.role}</p>
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

                    <div className="pt-3 border-t border-purple-500/20">
                      <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30"
                      >
                        <img src="/icons/logout.avif" className="h-5 w-5 mr-2 object-contain drop-shadow-md" />
                        {t('talentDashboard.closeSession')}
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
              <TabsList className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-1 mb-6">
                <TabsTrigger
                  value="trayectoria"
                  className="flex-1 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-fuchsia-500/20 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-purple-500/30 text-white/40 transition-all"
                >
                  <Award className="h-4 w-4 mr-1.5" />
                  {t('talentDashboard.tabTrayectoria')}
                </TabsTrigger>
                <TabsTrigger
                  value="formacion"
                  className="flex-1 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-fuchsia-500/20 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-purple-500/30 text-white/40 transition-all"
                >
                  <GraduationCap className="h-4 w-4 mr-1.5" />
                  {t('talentDashboard.tabFormacion')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="trayectoria">
                <TrayectoriaSection wallet={talent.wallet_address} />
              </TabsContent>
              <TabsContent value="formacion">
                <FormacionSection wallet={talent.wallet_address} />
              </TabsContent>
            </Tabs>
          </div>

          {/* ── Desktop: Two columns ── */}
          <div className="hidden md:grid md:grid-cols-[minmax(260px,300px)_1fr] gap-8">
            <aside className="relative overflow-hidden rounded-3xl bg-white/[0.02] border border-white/[0.07] p-5">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
              <div className="absolute -top-16 -left-16 w-40 h-40 bg-purple-500/8 rounded-full blur-[60px] pointer-events-none" />
              <h2 className="relative z-10 font-title text-[10px] uppercase tracking-[0.22em] text-white/35 font-bold mb-5 flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-purple-400/60" />
                {t('talentDashboard.sectionFormacion')}
              </h2>
              <div className="relative z-10">
                <FormacionSection wallet={talent.wallet_address} />
              </div>
            </aside>

            <section className="relative overflow-hidden rounded-3xl bg-white/[0.02] border border-white/[0.07] p-5">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent" />
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-fuchsia-500/8 rounded-full blur-[60px] pointer-events-none" />
              <h2 className="relative z-10 font-title text-[10px] uppercase tracking-[0.22em] text-white/35 font-bold mb-5 flex items-center gap-2">
                <img src="/icons/medalla.avif" className="h-3.5 w-3.5 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                {t('talentDashboard.sectionTrayectoria')}
              </h2>
              <div className="relative z-10">
                <TrayectoriaSection wallet={talent.wallet_address} />
              </div>
            </section>
          </div>

          {/* ── Descubrir Educadores ── */}
          <div className="mt-8">
            <p className="font-title text-[10px] uppercase tracking-[0.22em] text-white/35 font-bold mb-5 flex items-center gap-2">
              <img src="/icons/talentsPlattform.avif" className="h-3.5 w-8 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
              {t('talentDashboard.sectionDescubrir')}
            </p>
            <DescubrirSection />
          </div>
        </motion.main>
      </div>
    </Layout>
  );
};

export default TalentDashboard;

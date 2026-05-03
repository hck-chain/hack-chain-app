import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Award, Briefcase, Wallet, LogOut, ChevronDown, ExternalLink, GraduationCap, Users, Mail, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: idx * 0.06 }}
          className="flex flex-col rounded-2xl overflow-hidden bg-slate-900/20 border border-white/10 hover:border-white/20 hover:scale-[1.01] transition-all duration-300"
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
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition-all duration-200 active:scale-95"
            >
              <img
                src="https://static.seadn.io/logos/Logomark-White.png"
                alt="OpenSea"
                className="h-4 w-4"
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
      <Users className="h-10 w-10 mb-3 opacity-30" />
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
          transition={{ duration: 0.5 }}
          className="relative z-10 px-4 sm:px-6 md:px-10 pt-10 pb-20 max-w-[1600px] mx-auto"
        >
          {/* ---- Header ---- */}
          <header className="mb-10 grid grid-cols-2 md:grid-cols-3 items-center gap-4">
            <div className="flex flex-col">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-title font-bold tracking-tight">
                <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                  {t('talentDashboard.title')}
                </span>
              </h1>
              <p className="hidden sm:block text-sm md:text-base text-white/50 mt-1">
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
                      <Award className="h-4 w-4 text-white" />
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  className="w-72 p-0 bg-slate-900/40 backdrop-blur-xl border-white/10 shadow-2xl"
                  align="end"
                  sideOffset={8}
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-purple-500 to-fuchsia-500 flex items-center justify-center">
                        <Award className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{talent.name || t('talentDashboard.talentFallback')}</p>
                        <p className="text-xs text-fuchsia-400">{t('talentDashboard.talentFallback')}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                        <Briefcase className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs uppercase text-slate-500 font-semibold">{t('talentDashboard.roleLabel')}</p>
                          <p className="text-sm text-slate-200">{talent.role}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                        <Wallet className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs uppercase text-slate-500 font-semibold">{t('talentDashboard.walletLabel')}</p>
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
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                          <Mail className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs uppercase text-slate-500 font-semibold">{t('talentDashboard.emailLabel', 'Correo')}</p>
                            <p className="text-sm text-slate-200 font-mono">
                              {(() => {
                                const [name, domain] = talent.email.split('@');
                                return name && domain ? `${name.slice(0, 2)}***@${domain}` : talent.email;
                              })()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-white/10">
                      <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('talentDashboard.closeSession')}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </header>

          {/* ---- Mobile: Tabs ---- */}
          <div className="block md:hidden">
            <Tabs defaultValue="trayectoria">
              <TabsList className="w-full bg-white/5 border border-white/10 rounded-2xl p-1 mb-6">
                <TabsTrigger
                  value="trayectoria"
                  className="flex-1 rounded-xl data-[state=active]:bg-purple-500/15 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-purple-500/30 text-white/40 transition-all"
                >
                  <Award className="h-4 w-4 mr-1.5" />
                  {t('talentDashboard.tabTrayectoria')}
                </TabsTrigger>
                <TabsTrigger
                  value="formacion"
                  className="flex-1 rounded-xl data-[state=active]:bg-purple-500/15 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-purple-500/30 text-white/40 transition-all"
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

          {/* ---- Desktop: Two columns ---- */}
          <div className="hidden md:grid md:grid-cols-[minmax(260px,300px)_1fr] gap-6">
            {/* Left: Formación */}
            <aside>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                {t('talentDashboard.sectionFormacion')}
              </h2>
              <FormacionSection wallet={talent.wallet_address} />
            </aside>

            {/* Right: Trayectoria */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
                <Award className="h-4 w-4" />
                {t('talentDashboard.sectionTrayectoria')}
              </h2>
              <TrayectoriaSection wallet={talent.wallet_address} />
            </section>
          </div>

          {/* ---- Descubrir Educadores (full width, placeholder) ---- */}
          <div className="mt-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('talentDashboard.sectionDescubrir')}
            </h2>
            <DescubrirSection />
          </div>
        </motion.main>
      </div>
    </Layout>
  );
};

export default TalentDashboard;

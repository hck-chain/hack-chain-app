import Layout from '@/components/Layout';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Award, ChevronDown, Wallet, Briefcase, LogOut, CheckCircle, XCircle, Copy, Check, RefreshCw } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { ReferralsSection } from '@/components/dashboard/ReferralsSection';
import { appKit } from '@/config/walletConfig';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useRecruiterDashboard } from '@/hooks/useRecruiterDashboard';
import { Skeleton } from "@/components/ui/skeleton";
import { Users, AlertTriangle } from "lucide-react";
const HackChainLogo = '/images/logoHackchain2.webp';

function RecruiterCardSkeleton() {
    return (
        <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
            <Skeleton className="h-6 w-40 mb-3" />
            <Skeleton className="h-4 w-20 mb-6" />

            <div className="flex gap-2 mb-4">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            <Skeleton className="h-4 w-32" />
        </div>
    );
}

function RecruiterEmptyState() {
    const { t } = useTranslation();

    return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Users className="h-10 w-10 mb-3 opacity-30" />

                <p className="font-body text-base">
                    {t("recruiterDashboard.noTalents")}
                </p>

                <p className="font-body text-sm mt-1 text-center">
                    {t("recruiterDashboard.noTalentsHint")}
                </p>
            </div>
    );
}

interface RecruiterErrorStateProps {
  onRetry: () => void;
}

function RecruiterErrorState({ onRetry }: RecruiterErrorStateProps) {
    const { t } =useTranslation();

    return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertTriangle className="h-10 w-10 text-red-400 mb-4" />

                <p className="text-lg font-semibold text-white">
                    {t("recruiterDashboard.errorLoad")}
                </p>

                <p className="text-slate-400 mt-2">
                    {t("recruiterDashboard.errorLoadHint")}
                </p>

                <Button
                    onClick={onRetry}
                    className=" mt-6 flex items-center gap-2 h-8 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold shadow-lg shadow-purple-900/30 ">
                    <RefreshCw className="h-4 w-4" />
                    {t("common.retry")}
                </Button>
            </div>
    );
}

const RecruiterDashboard = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { toast } = useToast();
    const [copiedWallet, setCopiedWallet] = useState(false);

    const {
        recruiter,
        talents,
        loading,
        error,
        refetch,
    } = useRecruiterDashboard();

    useSessionTimeout({
        onExpired: () => {
            toast({
                title: t('talentDashboard.sessionExpiredTitle'),
                description: t('talentDashboard.sessionExpiredDesc'),
                variant: 'destructive',
            });
        },
    });

    
    
    const queryClient = useQueryClient();
    const { logout } = useAuth();
    const { isAdmin } = useAdminAccess();
    const handleLogout = async () => {
        logout();
        queryClient.clear();
        try { await appKit.disconnect(); } catch (_) { }
        toast({
            title: t('dashboard.logoutTitle'),
            description: t('dashboard.logoutDesc'),
        });
        window.location.href = '/login';
    };

    return (
        <Layout>
            <div className="min-h-screen relative font-body text-slate-200 px-6 md:px-12 pt-12 pb-20 max-w-[1600px] mx-auto">
                <motion.main
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10"
                >

                    {/* Header */}
                    <header className="mb-14 grid grid-cols-1 md:grid-cols-3 items-start md:items-center gap-6">

                        {/* Columna Izquierda: Títulos */}
                        <div className="flex flex-col">
                            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-2 font-title">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                    {t('recruiterDashboard.title')}
                                </span>
                            </h1>
                            <p className="text-lg text-slate-400 font-light font-body">
                                {t('recruiterDashboard.subtitle')}
                            </p>
                        </div>

                        {/* Columna Central: Logo (Centrado real y seguro) */}
                        <div className="hidden md:flex justify-center">
                            <img src={HackChainLogo} alt="Logo" className="h-16 md:h-24 object-contain" />
                        </div>

                        {/* Columna Derecha: Info del Reclutador */}
                        <div className="flex justify-end items-center gap-2">
                            <LanguageToggle />
                            {recruiter && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all max-w-full"
                                        >
                                            <div className="flex flex-row items-baseline gap-1 overflow-hidden">
                                                <span className="text-xs text-slate-400 font-medium font-body whitespace-nowrap">{t('recruiterDashboard.welcome')}</span>
                                                <span className="text-sm font-bold text-white font-title truncate max-w-[120px] lg:max-w-[180px]">
                                                    {recruiter.name}
                                                </span>
                                            </div>

                                            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                                                <Award className="h-4 w-4 text-white" />
                                            </div>

                                            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent
                                        className="w-80 p-0 bg-slate-900/40 backdrop-blur-xl border-white/10 shadow-2xl"
                                        align="end"
                                        sideOffset={8}
                                    >
                                        <div className="p-6 space-y-4">
                                            <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                                                    <Award className="h-6 w-6 text-white" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <h3 className="text-base font-bold text-white font-title truncate">{recruiter.name}</h3>
                                                    <p className="text-xs text-blue-400 font-medium font-body">{t('recruiterDashboard.recruiterFallback')}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                                    <Briefcase className="h-4 w-4 text-slate-400 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs uppercase text-slate-500 font-semibold font-body">{t('recruiterDashboard.totalCandidates')}</p>
                                                        <p className="text-sm text-slate-200 font-title">{recruiter.total_talents || 0}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                                    <Wallet className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs uppercase text-slate-500 font-semibold font-body">{t('recruiterDashboard.walletLabel')}</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm text-slate-200 font-body font-mono truncate">
                                                                {recruiter.wallet_address.slice(0, 6)}…{recruiter.wallet_address.slice(-4)}
                                                            </p>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(recruiter.wallet_address);
                                                                    setCopiedWallet(true);
                                                                    setTimeout(() => setCopiedWallet(false), 2000);
                                                                }}
                                                                className="shrink-0 text-slate-500 hover:text-blue-400 transition-colors"
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
                                                
                                                {isAdmin && (
                                                    <Link to="/admin" className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-colors">
                                                        <img src="/icons/escudoNeon.avif" className="h-5 w-6 object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs uppercase text-slate-500 font-semibold font-body">{t('recruiterDashboard.admin')}</p>
                                                            <p className="text-sm text-slate-200 font-title">{t('recruiterDashboard.adminPanel')}</p>
                                                        </div>
                                                    </Link>
                                                )}

                                                <div className="pt-4 border-t border-white/10">
                                                    <Button
                                                        onClick={handleLogout}
                                                        variant="outline"
                                                        className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 font-body"
                                                    >
                                                        <LogOut className="h-4 w-4 mr-2" />
                                                        {t('recruiterDashboard.logout')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </header>

                    {/* Grid de estudiantes */}
                <section className="rounded-3xl border border-white/[0.07] p-5">
                    <h2 className="font-title text-[10px] uppercase tracking-[0.22em] text-white/35 font-bold mb-5 flex items-center gap-2">
                        <img src="/icons/talentsPlattform.avif" className="h-3.5 w-3.5 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                        {t('recruiterDashboard.talentsAvailable')}
                    </h2>
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <RecruiterCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : error ? (
                        <RecruiterErrorState  onRetry={refetch}/>
                    ) : talents.length === 0 ? (
                        <RecruiterEmptyState />
                    ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {talents.map((talent) => (
                            <motion.div
                                key={talent.wallet_address}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35 }}
                                className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-[0_8px_20px_rgba(0,0,0,0.5)] 
                                    hover:scale-[1.03] hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)] transition-all cursor-pointer"
                                onClick={() => navigate(`/recruiter/talent/${talent.wallet_address}`)}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-white font-extrabold text-lg md:text-xl font-title">{talent.name}</p>
                                        <p className="text-slate-400 text-sm font-body">••••{talent.wallet_address.slice(-4)}</p>
                                    </div>
                                    {talent.is_active ? (
                                        <CheckCircle className="h-5 w-5 text-green-400" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-400" />
                                    )}
                                </div>

                                {/* Info pills adaptados */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-blue-500/20 text-blue-200 text-xs px-3 py-1 rounded-full font-medium font-body">
                                        {talent.field_of_study}
                                    </span>
                                    <span className="bg-indigo-500/20 text-indigo-200 text-xs px-3 py-1 rounded-full font-medium font-body">
                                        {t('recruiterDashboard.certificate', { count: talent.total_certificates })}
                                    </span>
                                </div>

                                {/* Footer */}
                                <p className="text-slate-400 text-xs mt-1 font-body">{t('recruiterDashboard.registered')} {new Date(talent.created_at).toLocaleDateString()}</p>
                            </motion.div>
                        ))}
                    </div>
                    )}
                </section>
                    <ReferralsSection />
                </motion.main>
            </div>
        </Layout >
    );
};

export default RecruiterDashboard;

// src/pages/RecruiterDashboard.tsx
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Award, ChevronDown, Wallet, Briefcase, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useQueryClient } from "@tanstack/react-query"; // <--- AÑADIR ESTO
const HackChainLogo = '/images/logoHackchain2.png';

interface Recruiter {
    wallet_address: string;
    name: string;
    role: string;
    total_talents?: number;
}

interface TalentSummary {
    id: number;
    wallet_address: string;
    field_of_study: string;
    created_at: string;
    is_active: boolean;
    name: string;
    total_certificates?: number;
}

const RecruiterDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [recruiter, setRecruiter] = useState<Recruiter | null>(null);
    const [talents, setTalents] = useState<TalentSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await api.get<{ user: any; modelName: string }>('/api/auth/me');
                setRecruiter({
                    wallet_address: data.user.wallet_address,
                    name: data.user.name,
                    role: data.user.role,
                });

                // Fetch talents
                const dataTalents = await api.get<{ students: any[] }>('/api/students');

                const talentsMapped: TalentSummary[] = dataTalents.students.map((s: any) => ({
                    id: s.id,
                    wallet_address: s.wallet_address,
                    field_of_study: s.field_of_study || 'N/A',
                    created_at: s.created_at,
                    is_active: s.user.is_active,
                    name: `${s.user.name} ${s.user.lastname || ''}`,
                    total_certificates: s.total_certificates || 0,
                }));
                talentsMapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                setTalents(talentsMapped);
                setRecruiter(prev => prev ? { ...prev, total_talents: talentsMapped.length } : null);
            } catch (err) {
                console.error(err);
                toast({
                    title: 'Error',
                    description: 'Failed to load recruiter or talents.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [toast]);

    const queryClient = useQueryClient();
    const handleLogout = () => {
        localStorage.clear();
        queryClient.clear();
        toast({
            title: "Sesión cerrada",
            description: "Vuelve pronto a HackChain",
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
                                    Recruiter Dashboard
                                </span>
                            </h1>
                            <p className="text-lg text-slate-400 font-light font-body">
                                Manage your talents efficiently and track their progress.
                            </p>
                        </div>

                        {/* Columna Central: Logo (Centrado real y seguro) */}
                        <div className="hidden md:flex justify-center">
                            <img src={HackChainLogo} alt="Logo" className="h-16 md:h-24 object-contain" />
                        </div>

                        {/* Columna Derecha: Info del Reclutador */}
                        <div className="flex justify-end">
                            {recruiter && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all max-w-full"
                                        >
                                            <div className="flex flex-row items-baseline gap-1 overflow-hidden">
                                                <span className="text-xs text-slate-400 font-medium font-body whitespace-nowrap">Welcome back,</span>
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
                                                    <p className="text-xs text-blue-400 font-medium font-body">Recruiter</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                                    <Briefcase className="h-4 w-4 text-slate-400 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs uppercase text-slate-500 font-semibold font-body">Total Candidates</p>
                                                        <p className="text-sm text-slate-200 font-title">{recruiter.total_talents || 0}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                                    <Wallet className="h-4 w-4 text-slate-400 mt-0.5" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs uppercase text-slate-500 font-semibold font-body">WALLET</p>
                                                        <p className="text-sm text-slate-200 font-body truncate">
                                                            ••••{recruiter.wallet_address.slice(-4)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-white/10">
                                                    <Button
                                                        onClick={handleLogout}
                                                        variant="outline"
                                                        className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 font-body"
                                                    >
                                                        <LogOut className="h-4 w-4 mr-2" />
                                                        Logout
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
                                        {talent.total_certificates} {talent.total_certificates === 1 ? 'Certificate' : 'Certificates'}
                                    </span>
                                </div>

                                {/* Footer */}
                                <p className="text-slate-400 text-xs mt-1 font-body">Registered: {new Date(talent.created_at).toLocaleDateString()}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.main>
            </div>
        </Layout >
    );
};

export default RecruiterDashboard;

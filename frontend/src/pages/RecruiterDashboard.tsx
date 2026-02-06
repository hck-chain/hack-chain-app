// src/pages/RecruiterDashboard.tsx
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Award, ChevronDown, Wallet, Briefcase, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HackChainLogo from '@/../public/images/logoHackchain2.png'; // 🔹 Logo de HackChain
const API_BASE_URL = import.meta.env.VITE_API_URL;

interface Recruiter {
    wallet_address: string;
    name: string;
    role: string;
    total_students?: number;
}

interface StudentSummary {
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
    const [students, setStudents] = useState<StudentSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) return;

                // Fetch recruiter info
                const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setRecruiter({
                    wallet_address: data.user.wallet_address,
                    name: data.user.name,
                    role: data.user.role,
                });

                // Fetch students
                const resStudents = await fetch(`${API_BASE_URL}/api/students`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const dataStudents = await resStudents.json();

                const studentsMapped: StudentSummary[] = dataStudents.students.map((s: any) => ({
                    id: s.id,
                    wallet_address: s.wallet_address,
                    field_of_study: s.field_of_study || 'N/A',
                    created_at: s.created_at,
                    is_active: s.user.is_active,
                    name: `${s.user.name} ${s.user.lastname || ''}`,
                    total_certificates: s.total_certificates || 0,
                }));
                studentsMapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                setStudents(studentsMapped);
                setRecruiter(prev => prev ? { ...prev, total_students: studentsMapped.length } : null);
            } catch (err) {
                console.error(err);
                toast({
                    title: 'Error',
                    description: 'Failed to load recruiter or students.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [toast]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        toast({
            title: "Logged out",
            description: "You have been logged out successfully.",
        });
        navigate('/login');
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
                    <header className="relative mb-14 flex items-center">
                        {/* Texto a la izquierda */}
                        <div className="flex-1">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2 font-title">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                    Recruiter Dashboard
                                </span>
                            </h1>
                            <p className="text-lg text-slate-400 font-light font-body">
                                Manage your students efficiently and track their progress easily.
                            </p>
                        </div>

                        {/* Logo centrado */}
                        <div className="absolute left-1/2 transform -translate-x-1/2">
                            <img src={HackChainLogo} alt="Logo" className="h-16 md:h-28" />
                        </div>

                        {/* Recruiter info popup */}
                        {recruiter && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all"
                                    >
                                        <div className="flex flex-row items-baseline gap-1">
                                            <span className="text-xs text-slate-400 font-medium font-body">Welcome back,</span>
                                            <span className="text-sm font-bold text-white font-title">{recruiter.name}</span>
                                        </div>

                                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                                            <Award className="h-4 w-4 text-white" />
                                        </div>

                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent
                                    className="w-80 p-0 bg-slate-900/40 backdrop-blur-xl border-white/10 shadow-2xl"
                                    align="end"
                                    sideOffset={8}
                                >
                                    <div className="p-6 space-y-4">
                                        {/* Header */}
                                        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                                                <Award className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-bold text-white font-title">{recruiter.name}</h3>
                                                <p className="text-xs text-blue-400 font-medium font-body">Recruiter</p>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                                <Briefcase className="h-4 w-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs uppercase text-slate-500 font-semibold font-body">Total Candidates</p>
                                                    <p className="text-sm text-slate-200 font-title">{recruiter.total_students || 0}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                                <Wallet className="h-4 w-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs uppercase text-slate-500 font-semibold font-body">ROLE</p>
                                                    <p className="text-sm text-slate-200 font-body"> Recruiter </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                                <Briefcase className="h-4 w-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs uppercase text-slate-500 font-semibold font-body">WALLET</p>
                                                    <p className="text-sm text-slate-200 font-body">
                                                        ••••{recruiter.wallet_address.slice(-4)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Logout Button */}
                                            <div className="pt-4 border-t border-white/10">
                                                <Button
                                                    onClick={handleLogout}
                                                    variant="outline"
                                                    className="
                                                        w-full
                                                        border-red-500/20
                                                        text-red-400
                                                        hover:bg-red-500/10
                                                        hover:text-red-300
                                                        hover:border-red-500/30
                                                    "
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
                    </header>

                    {/* Student Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {students.map((student) => (
                            <motion.div
                                key={student.wallet_address}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35 }}
                                className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-[0_8px_20px_rgba(0,0,0,0.5)] 
                hover:scale-[1.03] hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)] transition-all cursor-pointer flex flex-col justify-between"
                                onClick={() => navigate(`/recruiter/student/${student.wallet_address}`)}
                            >
                                {/* Header: Name and Status Icon */}
                                <div className="flex items-center justify-between mb-6">
                                    <p className="text-white font-extrabold text-lg md:text-xl font-title leading-tight">
                                        {student.name}
                                    </p>
                                    {student.is_active ? (
                                        <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                                    )}
                                </div>

                                {/* Information Pills Container */}
                                <div className="flex flex-wrap gap-2">
                                    {/* Wallet Pill */}
                                    <div className="bg-slate-500/10 text-slate-400 text-[10px] px-3 py-1 rounded-full font-medium font-body border border-white/5 uppercase tracking-wider">
                                        {student.wallet_address.slice(0, 6)}...{student.wallet_address.slice(-4)}
                                    </div>

                                    {/* Certificates Pill */}
                                    <div className="bg-indigo-500/20 text-indigo-200 text-xs px-3 py-1 rounded-full font-medium font-body border border-indigo-500/10">
                                        {student.total_certificates} {student.total_certificates === 1 ? 'Certificate' : 'Certificates'}
                                    </div>

                                    {/* Registration Date Pill */}
                                    <div className="bg-blue-500/20 text-blue-200 text-xs px-3 py-1 rounded-full font-medium font-body border border-blue-500/10">
                                        {new Date(student.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.main>
            </div>
        </Layout >
    );
};

export default RecruiterDashboard;

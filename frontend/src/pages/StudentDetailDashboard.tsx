import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Award, ChevronDown, Briefcase, Wallet, ArrowLeft, Calendar } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import HackChainLogo from '@/../public/images/logoHackchain2.png'; // 🔹 Logo de HackChain

interface Certificate {
    identifier: string;
    contract: string;
    name?: string;
    description?: string;
    image_url: string;
    display_image_url?: string;
    original_image_url?: string;
}

interface Student {
    wallet_address: string;
    name?: string;
    field_of_study?: string;
    total_certificates?: number;
    created_at?: string;
}

const StudentDetailDashboard = () => {
    const navigate = useNavigate();
    const { wallet_address } = useParams<{ wallet_address: string }>();
    const [student, setStudent] = useState<Student | null>(null);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const loadData = async () => {
            if (!wallet_address) return;

            try {
                const token = localStorage.getItem('authToken');
                if (!token) return;

                // Student info
                const res = await fetch(`http://localhost:3001/api/students/${wallet_address}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!data.student) throw new Error("Student not found");

                setStudent({
                    wallet_address: data.student.wallet_address,
                    name: data.student.user.name + ' ' + (data.student.user.lastname || ''),
                    field_of_study: data.student.field_of_study || 'N/A',
                    total_certificates: data.student.total_certificates || 0,
                    created_at: data.student.created_at,
                });

                // Certificates
                const certRes = await fetch('http://localhost:3001/api/opensea/certificates/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ address: wallet_address }),
                });
                const certData = await certRes.json();
                setCertificates(certData);
            } catch (err) {
                console.error(err);
                toast({
                    title: "Error",
                    description: "Failed to load student data or certificates.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [wallet_address, toast]);

    const goBackToRecruiterDashboard = () => {
        navigate('/dashboard/recruiter');
    };

    const resolveImage = (url?: string) => {
        if (!url) return '';
        return url.startsWith('ipfs://')
            ? url.replace('ipfs://', 'https://ipfs.io/ipfs/')
            : url;
    };

    const viewOnOpenSea = (cert: Certificate) => {
        const url = `https://opensea.io/assets/polygon/${cert.contract}/${cert.identifier}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (!student) return 0;

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
                    <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            <Button
                                onClick={goBackToRecruiterDashboard}
                                variant="ghost"
                                className="flex items-center gap-2 text-white hover:text-blue-400"
                            >
                                <ArrowLeft className="h-5 w-5" /> Back
                            </Button>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2 font-title">
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                        {student.name}
                                    </span>
                                </h1>
                                <p className="text-lg text-slate-400 font-light font-body">
                                    Student details and certificates
                                </p>
                            </div>
                        </div>
                        {/* Logo centrado */}
                        <div className="absolute left-1/2 transform -translate-x-1/2">
                            <img src={HackChainLogo} alt="Logo" className="h-16 md:h-28" />
                        </div>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all"
                                >
                                    <div className="flex flex-row items-baseline gap-1">
                                        <span className="text-xs text-slate-400 font-body font-medium">Student:</span>
                                        <span className="text-sm font-title font-bold text-white">
                                            {student.name}
                                        </span>
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
                                    <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                                            <Award className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-base font-title font-bold text-white">{student.name}</h3>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="space-y-3">
                                        {/* Certificates */}
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                            <Award className="h-4 w-4 text-slate-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs uppercase text-slate-500 font-body font-semibold">Certificates</p>
                                                <p className="text-sm text-slate-200 font-body">{student.total_certificates}</p>
                                            </div>
                                        </div>

                                        {/* Field of Study */}
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                            <Briefcase className="h-4 w-4 text-slate-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs uppercase text-slate-500 font-body font-semibold">Field of Study</p>
                                                <p className="text-sm text-slate-200 font-body">{student.field_of_study}</p>
                                            </div>
                                        </div>

                                        {/* Wallet */}
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                            <Wallet className="h-4 w-4 text-slate-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs uppercase text-slate-500 font-body font-semibold">Wallet</p>
                                                <p className="text-sm text-slate-200 font-body">
                                                    ••••{student.wallet_address.slice(-4)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Registered */}
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                            <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs uppercase text-slate-500 font-body font-semibold">Registered</p>
                                                <p className="text-sm text-slate-200 font-body">
                                                    {new Date(student.created_at || '').toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </header>

                    {/* Certificates Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {certificates.map(cert => (
                            <motion.div
                                key={`${cert.contract}-${cert.identifier}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="bg-slate-900/20 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-md hover:scale-[1.02] transition-transform"
                            >
                                <div className="w-full bg-black flex items-center justify-center">
                                    <img
                                        src={resolveImage(cert.original_image_url || cert.display_image_url || cert.image_url)}
                                        alt={`Certificate ${cert.identifier}`}
                                        className="w-full h-auto object-contain"
                                    />
                                </div>
                                <div className="p-0 flex flex-col items-center gap-3">
                                    <button
                                        onClick={() => viewOnOpenSea(cert)}
                                        className="
                                            px-4 py-2
                                            bg-gradient-to-r from-blue-500 to-indigo-600
                                            hover:from-blue-600 hover:to-indigo-700
                                            text-white
                                            text-sm font-body font-semibold
                                            rounded-lg
                                            shadow-md hover:shadow-lg
                                            transition-all duration-300
                                            transform hover:-translate-y-0.5
                                            flex items-center gap-2
                                        "
                                    >
                                        <img
                                            src="https://static.seadn.io/logos/Logomark-White.png"
                                            alt="OpenSea"
                                            className="h-4 w-4"
                                        />
                                        View on OpenSea
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.main>
            </div>
        </Layout>
    );
};

export default StudentDetailDashboard;

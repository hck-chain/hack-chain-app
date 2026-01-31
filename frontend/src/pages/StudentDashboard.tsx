// src/pages/StudentDashboard.tsx
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Award, ChevronDown, Mail, Briefcase, Wallet, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Certificate {
    identifier: string;   // tokenId real
    contract: string;     // contract address real
    name?: string;
    description?: string;
    image_url: string;
    display_image_url?: string;
    original_image_url?: string;
}


interface Student {
    wallet_address: string;
    name?: string;
    email?: string;
    role?: string;
}

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [student, setStudent] = useState<Student | null>(null);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) return;

                // Student info
                const res = await fetch('http://localhost:3001/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                console.log("la data es: ", data);
                setStudent({
                    wallet_address: data.user.wallet_address,
                    name: data.user.name,
                    email: data.user.email,
                    role: data.modelName || 'Student',
                });

                // Certificates
                const certRes = await fetch('http://localhost:3001/api/opensea/certificates/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ address: data.user.wallet_address }),
                });
                const certData = await certRes.json();

                console.log("Certificates fetched from backend:", certData); // 🔹 depuración
                certData.forEach((cert: Certificate) => console.log("Cert:", cert)); // 🔹 cada certificado

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

    const resolveImage = (url?: string) => {
        if (!url) return '';
        return url.startsWith('ipfs://')
            ? url.replace('ipfs://', 'https://ipfs.io/ipfs/')
            : url;
    };

    if (!student) {
        return null;
    }

    // 🔹 Función para abrir NFT en OpenSea
    const viewOnOpenSea = (cert: Certificate) => {
        const url = `https://opensea.io/assets/polygon/${cert.contract}/${cert.identifier}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };





    return (
        <Layout>
            <div className="min-h-screen relative font-sans text-slate-200">
                <motion.main
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 px-6 md:px-12 pt-12 pb-20 max-w-[1600px] mx-auto"
                >
                    {/* Header */}
                    <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                    Student Dashboard
                                </span>
                            </h1>
                            <p className="text-lg text-slate-400 font-light">
                                View your tokenized certificates.                            </p>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all"
                                >
                                    <div className="flex flex-row items-baseline gap-1">
                                        <span className="text-xs text-slate-400 font-medium">Welcome back,</span>
                                        <span className="text-sm font-bold text-white">
                                            {student.name || "Student"}
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

                                    {/* Header */}
                                    <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                                            <Award className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-base font-bold text-white">
                                                {student.name || "Student"}
                                            </h3>
                                            <p className="text-xs text-blue-400 font-medium">
                                                {"Student"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="space-y-3">

                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                            <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs uppercase text-slate-500 font-semibold">Email</p>
                                                <p className="text-sm text-slate-200 truncate">
                                                    {student.email || "No email registered"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                            <Briefcase className="h-4 w-4 text-slate-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs uppercase text-slate-500 font-semibold">Role</p>
                                                <p className="text-sm text-slate-200">Student</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                            <Wallet className="h-4 w-4 text-slate-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs uppercase text-slate-500 font-semibold">Wallet</p>
                                                <p className="text-sm text-slate-200 font-mono">
                                                    ••••{student.wallet_address.slice(-4)}
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

                    </header>

                    {/* Certificates Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {certificates.length === 0 ? (
                            <div className="col-span-full text-center text-slate-400">
                                No certificates found
                            </div>
                        ) : (
                            certificates.map(cert => {
                                console.log("Rendering certificate:", cert); // 🔹 depuración en render
                                return (
                                    <motion.div
                                        key={`${cert.contract}-${cert.identifier}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="bg-slate-900/20 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-md hover:scale-[1.02] transition-transform"
                                    >
                                        <div className="w-full bg-black flex items-center justify-center">
                                            <img
                                                src={resolveImage(
                                                    cert.original_image_url ||
                                                    cert.display_image_url ||
                                                    cert.image_url
                                                )}
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
                                                    text-sm font-semibold
                                                    rounded-lg
                                                    shadow-md hover:shadow-lg
                                                    transition-all duration-300
                                                    transform hover:-translate-y-0.5
                                                    flex items-center gap-2
                                                "
                                            >
                                                {/* Logo de OpenSea */}
                                                <img
                                                    src="https://static.seadn.io/logos/Logomark-White.png"
                                                    alt="OpenSea"
                                                    className="h-4 w-4"
                                                />
                                                View on OpenSea
                                            </button>
                                        </div>

                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </motion.main>
            </div>
        </Layout>
    );
};

export default StudentDashboard;

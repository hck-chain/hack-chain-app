import Layout from '@/components/Layout';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CertificateCard from '@/components/CertificateCard/CertificateCard';
import html2canvas from 'html2canvas'; // ✅ Volvemos a html2canvas
import { useCreateCertificate } from '@/hooks/useCreateCertificate';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Award, ChevronDown, Mail, Briefcase, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCertificatesByEducator } from '@/utils/web3Service';
import { api } from '@/services/api';
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from '@/contexts/AuthContext';
import { appKit } from '@/config/walletConfig';
const HackChainLogo = '/images/logoHackchain2.png';

interface Talent {
  id: number;
  wallet_address: string;
  field_of_study: string;
  user: {
    id: number;
    name: string;
    wallet_address: string;
    email: string;
  };
}

const EducatorDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    certificateType: '',
    certificateTitle: '',
    talentName: '',
    talentWallet: '',
    issuer: '',
    issueDate: new Date().toISOString().split('T')[0],
    logo: '',
    imageUri: '',
  });

  const [wallet, setWallet] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [logoPreview, setLogoPreview] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [talents, setTalents] = useState<Talent[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const [certificatesIssued, setCertificatesIssued] = useState<number>(0);

  const { createCertificate, isLoading } = useCreateCertificate();
  const { toast } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api.get<{ user: any; modelName: string }>('/api/auth/me');
        setUserData({
          organization_name: data.user.organization_name,
          walletAddress: data.user.wallet_address,
          email: data.user.email ?? "No email registered",
          role: "Educator",
        });
        const certCount = await getCertificatesByEducator(data.user.wallet_address);
        setCertificatesIssued(certCount);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    };

    loadProfile();

    const fetchTalents = async () => {
      try {
        const data = await api.get<{ students: any[] }>('/api/students');
        if (data.students) {
          const normalizedTalents = data.students.map((s: any) => ({
            ...s,
            user: s.User || s.user
          }));
          setTalents(normalizedTalents);
        }
      } catch (error) {
        console.error("Failed to fetch talents", error);
        toast({
          title: "Error",
          description: t('educatorDashboard.errorLoad'),
          variant: "destructive",
        });
      }
    };

    fetchTalents();
  }, [navigate, toast]);

  const queryClient = useQueryClient();
  const { logout } = useAuth();

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'logo' && e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setForm({ ...form, logo: URL.createObjectURL(file) });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleTalentChange = (walletAddress: string) => {
    const selectedTalent = talents.find(s => s.user.wallet_address === walletAddress);
    if (selectedTalent) {
      setForm({
        ...form,
        talentWallet: selectedTalent.user.wallet_address,
        talentName: selectedTalent.user.name
      });
    }
  };

  const handleCreateCertificate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!userData?.walletAddress) {
      toast({ title: "Error", description: t('educatorDashboard.noWallet'), variant: "destructive" });
      navigate('/login');
      return;
    }

    if (!form.certificateTitle || !form.talentName || !form.issuer || !form.talentWallet) {
      toast({ title: "Error", description: t('educatorDashboard.fillFields'), variant: "destructive" });
      return;
    }

    try {
      const container = cardRef.current;
      if (!container) return;

      const card = (container.querySelector('.pc-card') as HTMLElement) || container;

      // ✅ Ocultamos shine y glare antes de capturar para evitar colores quemados
      const shine = card.querySelector('.pc-shine') as HTMLElement | null;
      const glare = card.querySelector('.pc-glare') as HTMLElement | null;
      if (shine) shine.style.display = 'none';
      if (glare) glare.style.display = 'none';
      card.classList.add('is-capturing');

      toast({
        title: t('educatorDashboard.processing'),
        description: t('educatorDashboard.processingDesc'),
      });

      await new Promise(r => setTimeout(r, 150));

      const canvas = await html2canvas(card, {
        backgroundColor: '#0b0b0b',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // ✅ Restauramos shine y glare después de capturar
      if (shine) shine.style.display = '';
      if (glare) glare.style.display = '';
      card.classList.remove('is-capturing');

      const imageBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas to Blob conversion failed"));
        }, 'image/png');
      });

      const formData = new FormData();
      formData.append("file", imageBlob, `cert-${form.talentName.replace(/\s+/g, '_')}.png`);

      const uploadResult = await api.upload<{ cid: string }>('/api/upload/image', formData);
      const realImageCID = uploadResult.cid;
      console.log("Image successfully pinned:", realImageCID);

      const certificateData = {
        talentName: form.talentName,
        talentWallet: form.talentWallet,
        courseName: form.certificateTitle,
        professorName: form.issuer,
        issueDate: form.issueDate,
        imageUri: realImageCID,
      };

      const success = await createCertificate(certificateData, userData.walletAddress);

      if (success) {
        toast({
          title: t('educatorDashboard.mintSuccess'),
          description: t('educatorDashboard.mintSuccessDesc'),
        });
        setForm({
          certificateType: '',
          certificateTitle: '',
          talentName: '',
          talentWallet: '',
          issuer: '',
          issueDate: new Date().toISOString().split('T')[0],
          logo: '',
          imageUri: '',
        });
        setLogoPreview('');
      }

    } catch (error: any) {
      const container = cardRef.current;
      if (container) {
        const card = container.querySelector('.pc-card') as HTMLElement | null;
        if (card) {
          const shine = card.querySelector('.pc-shine') as HTMLElement | null;
          const glare = card.querySelector('.pc-glare') as HTMLElement | null;
          if (shine) shine.style.display = '';
          if (glare) glare.style.display = '';
          card.classList.remove('is-capturing');
        }
      }
      console.error('Full creation process error:', error);
      toast({
        title: "Error",
        description: error.message || t('educatorDashboard.errorUnexpected'),
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const container = cardRef.current;
    if (!container) return;

    const card = (container.querySelector('.pc-card') as HTMLElement) || container;
    const shine = card.querySelector('.pc-shine') as HTMLElement | null;
    const glare = card.querySelector('.pc-glare') as HTMLElement | null;

    // ✅ Ocultamos shine y glare antes de capturar
    if (shine) shine.style.display = 'none';
    if (glare) glare.style.display = 'none';
    card.classList.add('is-capturing');

    try {
      await new Promise(r => setTimeout(r, 150));

      const canvas = await html2canvas(card, {
        backgroundColor: '#0b0b0b',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        imageTimeout: 0,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const title = (typeof form.certificateTitle === 'string' && form.certificateTitle) || 'certificate';
      link.download = `${title}.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: t('educatorDashboard.downloadSuccess'),
        description: t('educatorDashboard.downloadSuccessDesc'),
      });
    } catch (err) {
      console.error('Failed to generate image', err);
      toast({
        title: "Error",
        description: t('educatorDashboard.downloadError'),
        variant: "destructive",
      });
    } finally {
      // ✅ Siempre restauramos shine y glare al terminar
      if (shine) shine.style.display = '';
      if (glare) glare.style.display = '';
      card.classList.remove('is-capturing');
    }
  };

  if (!userData) {
    return null;
  }

  return (
    <Layout>
      {/* Container principal transparente para dejar ver el fondo global */}
      <div className="min-h-screen relative font-sans text-slate-200">

        <motion.main
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 px-4 sm:px-6 md:px-12 pt-8 sm:pt-12 pb-20 max-w-[1600px] mx-auto"
        >

          {/* Header Section */}
          <header className="mb-8 sm:mb-16 md:mb-28 grid grid-cols-1 md:grid-cols-3 items-start md:items-center gap-6">

            {/* Columna Izquierda: Títulos */}
            <div className="flex flex-col">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  {t('educatorDashboard.title')}
                </span>
              </h1>
              <p className="text-lg text-slate-400 font-light">
                {t('educatorDashboard.subtitle')}
              </p>
            </div>

            {/* Columna Central: Logo (Centrado real y seguro) */}
            <div className="hidden md:flex justify-center">
              <img src={HackChainLogo} alt="Logo" className="h-16 md:h-24 object-contain" />
            </div>

            {/* Columna Derecha: Popover de Usuario */}
            <div className="flex justify-end items-center gap-2">
              <LanguageToggle />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 hover:bg-white/10 transition-all cursor-pointer max-w-full"
                  >
                    <div className="flex flex-row items-baseline gap-1 overflow-hidden">
                      <span className="text-sm text-slate-400 font-medium whitespace-nowrap">{t('educatorDashboard.welcome')}</span>
                      <span className="text-sm font-bold text-white truncate max-w-[120px] lg:max-w-[180px]">
                        {userData.organization_name || t('educatorDashboard.roleName')}
                      </span>
                    </div>
                    <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <Award className="h-5 w-5 text-white" />
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
                      <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                        <Award className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h3 className="text-base font-bold text-white truncate">
                          {userData.organization_name || "My Organization"}
                        </h3>
                        <p className="text-xs text-purple-400 font-medium">{userData.role || t('educatorDashboard.roleName')}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                        <Mail className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1">{t('educatorDashboard.certificatesIssued')}</p>
                          <p className="text-sm text-slate-200 truncate">{certificatesIssued > 0 ? certificatesIssued : t('educatorDashboard.noneYet')}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                        <Briefcase className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1">{t('educatorDashboard.roleLabel')}</p>
                          <p className="text-sm text-slate-200">{t('educatorDashboard.roleName')}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                        <Wallet className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1">{t('educatorDashboard.walletLabel')}</p>
                          <p className="text-sm text-slate-200 font-mono">
                            ••••{userData.walletAddress?.slice(-4) || "••••"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('educatorDashboard.logout')}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </header>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            {/* Left Column: Form (Create) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 order-2 lg:order-1"
            >
              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                {/* Internal decorative gradient */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">{t('educatorDashboard.formTitle')}</h2>
                  <p className="text-slate-400 text-sm">{t('educatorDashboard.formSubtitle')}</p>
                </div>

                <form className="space-y-6">
                  <div className="space-y-4">
                    <div className="group/input">
                      <Label htmlFor="certificateTitle" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 block group-focus-within/input:text-purple-400 transition-colors">{t('educatorDashboard.fieldCertTitle')}</Label>
                      <Input
                        id="certificateTitle"
                        name="certificateTitle"
                        value={form.certificateTitle}
                        onChange={handleChange}
                        placeholder={t('educatorDashboard.fieldCertTitlePlaceholder')}
                        className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl h-12 transition-all"
                      />
                    </div>

                    <div className="group/input">
                      <Label htmlFor="talentName" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 block group-focus-within/input:text-purple-400 transition-colors">{t('educatorDashboard.fieldTalentName')}</Label>
                      <Select onValueChange={handleTalentChange} value={form.talentWallet}>
                        <SelectTrigger className="w-full bg-black/20 border-white/10 text-white rounded-xl h-12">
                          <SelectValue placeholder={t('educatorDashboard.selectTalent')} />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                          {talents.map((talent) => (
                            <SelectItem key={talent.id} value={talent.user.wallet_address}>
                              {talent.user.name} ({talent.user.wallet_address.slice(0, 6)}...{talent.user.wallet_address.slice(-4)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-500 mt-1 pl-1">
                        {t('educatorDashboard.selectedWallet')} {form.talentWallet || t('educatorDashboard.selectedWalletNone')}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="group/input">
                        <Label htmlFor="issuer" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 block group-focus-within/input:text-purple-400 transition-colors">{t('educatorDashboard.fieldIssuer')}</Label>
                        <Input
                          id="issuer"
                          name="issuer"
                          value={form.issuer}
                          onChange={handleChange}
                          placeholder={t('educatorDashboard.fieldIssuerPlaceholder')}
                          className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl h-12 transition-all"
                        />
                      </div>
                      <div className="group/input">
                        <Label htmlFor="issueDate" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 block group-focus-within/input:text-purple-400 transition-colors">{t('educatorDashboard.fieldDate')}</Label>
                        <Input
                          id="issueDate"
                          name="issueDate"
                          type="date"
                          value={form.issueDate}
                          onChange={handleChange}
                          className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl h-12 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    <div className="group/input">
                      <Label htmlFor="certificateType" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 block group-focus-within/input:text-purple-400 transition-colors">{t('educatorDashboard.fieldType')}</Label>
                      <Input
                        id="certificateType"
                        name="certificateType"
                        value={form.certificateType}
                        onChange={handleChange}
                        placeholder={t('educatorDashboard.fieldTypePlaceholder')}
                        className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl h-12 transition-all"
                      />
                    </div>

                    <div className="group/input">
                      <Label htmlFor="logo" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 block group-focus-within/input:text-purple-400 transition-colors">{t('educatorDashboard.fieldLogo')}</Label>
                      <div className="relative">
                        <Input
                          id="logo"
                          name="logo"
                          type="file"
                          accept="image/*"
                          onChange={handleChange}
                          className="bg-black/20 border-white/10 file:bg-white/10 file:text-white file:border-0 file:rounded-lg file:px-4 file:mr-4 hover:file:bg-white/20 text-slate-400 cursor-pointer rounded-xl pt-2 pb-2 h-auto transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex flex-col sm:flex-row gap-4">
                    <Button
                      type="button"
                      onClick={handleCreateCertificate}
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-purple-900/40 border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('educatorDashboard.creating')}</span>
                      ) : t('educatorDashboard.createCertificate')}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleDownload}
                      variant="outline"
                      className="px-6 h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all hover:scale-[1.02]"
                    >
                      {t('educatorDashboard.preview')}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>

            {/* Right Column: Preview (Large) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="lg:col-span-7 order-1 lg:order-2 lg:sticky lg:top-8"
            >
              <div className="bg-slate-900/20 backdrop-blur-sm border border-white/5 rounded-[40px] p-8 md:p-8 flex flex-col items-center justify-center min-h-[600px] relative">
                {/* "Preview" Label */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                  <span className="text-xs font-medium tracking-widest uppercase text-slate-400">{t('educatorDashboard.livePreview')}</span>
                </div>

                <div className="transform transition-transform hover:scale-[1.02] duration-500" ref={cardRef}>
                  <CertificateCard
                    certificateType={form.certificateType || "Certificate of Completion"}
                    name={form.talentName || 'Talent Name'}
                    title={form.certificateTitle || 'Certificate Title'}
                    issuer={form.issuer || 'Issuer Name'}
                    issueDate={form.issueDate || 'Issue Date'}
                    logoUrl={form.logo || ''}
                    enableTilt={true}
                    innerGradient={""}
                  />
                </div>

                <div className="mt-3 text-center max-w-md">
                  <h3 className="text-white font-semibold text-lg mb-1">{t('educatorDashboard.reviewTitle')}</h3>
                  <p className="text-slate-500 text-sm">
                    {t('educatorDashboard.reviewDesc')}
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </motion.main>
      </div>
    </Layout>
  );
};

export default EducatorDashboard;

import Layout from '@/components/Layout';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { LogOut, ChevronDown, Mail, Briefcase, Wallet, FileText, Trash2, UserPen, Copy, Check, Users, BadgeCheck, Bell, User } from 'lucide-react';
import { usePendingClassRequestsCount } from '@/hooks/usePendingClassRequestsCount';
import { useEducatorClassRequests, type EducatorClassRequest } from '@/hooks/useEducatorClassRequests';
import { motion, AnimatePresence } from 'framer-motion';
import { getCertificatesByEducator } from '@/utils/web3Service';
import { api } from '@/services/api';
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from '@/contexts/AuthContext';
import { ReferralsSection } from '@/components/dashboard/ReferralsSection';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { appKit } from '@/config/walletConfig';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { DeleteAccountModal } from '@/components/DeleteAccountModal/DeleteAccountModal';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
const HackChainLogo = '/images/logoHackchain2.webp';

function resolveIpfs(url: string | null): string {
  if (!url) return '';
  if (url.startsWith('ipfs://')) {
    return `https://gateway.pinata.cloud/ipfs/${url.slice(7)}`;
  }
  return url;
}

function EducatorAvatar({ photoUrl, size = 'md' }: { photoUrl: string | null; size?: 'sm' | 'md' }) {
  const resolved = resolveIpfs(photoUrl);
  const sizeClass = size === 'sm' ? 'h-10 w-10' : 'h-14 w-14';
  const iconSize = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7';

  if (resolved) {
    return (
      <img
        src={resolved}
        alt="Profile"
        className={`${sizeClass} rounded-full object-cover shrink-0 border border-white/10`}
      />
    );
  }
  const imgSize = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  return (
    <div className={`${sizeClass} shrink-0 rounded-full bg-black border-2 border-purple-500 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.5)]`}>
      <img src="/icons/medalla.avif" alt="Educator" className={`${imgSize} object-contain`} />
    </div>
  );
}

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

function NotificationBellPanel() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data, isPending } = useEducatorClassRequests();
  const pending = (data ?? []).filter((r: EducatorClassRequest) => r.status === 'pending').slice(0, 5);
  const locale = i18n.language.startsWith('es') ? 'es-MX' : 'en-US';

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span className="text-sm font-semibold text-white">{t('educatorClassRequests.notifTitle')}</span>
        {pending.length > 0 && (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20 tabular-nums">
            {pending.length}
          </span>
        )}
      </div>

      {isPending ? (
        <div className="py-5 px-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-7 w-7 rounded-full bg-white/[0.06] shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-24 bg-white/[0.05] rounded-full" />
                <div className="h-2 w-16 bg-white/[0.04] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="py-8 flex flex-col items-center gap-2">
          <Bell className="h-7 w-7 text-slate-700" />
          <p className="text-xs text-slate-500">{t('educatorClassRequests.noPending')}</p>
        </div>
      ) : (
        <div>
          {pending.map((req: EducatorClassRequest) => (
            <button
              key={req.id}
              onClick={() => navigate('/educator/class-requests')}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] border-b border-white/[0.04] last:border-b-0 transition-colors text-left"
            >
              <div className="h-7 w-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {req.student_name || req.student_wallet.slice(0, 8) + '…'}
                </p>
                {req.class_name && (
                  <p className="text-[11px] text-slate-500 truncate mt-px">{req.class_name}</p>
                )}
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {new Date(req.requested_date + 'T00:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' })} · {req.start_time}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-3 border-t border-white/[0.06]">
        <Link
          to="/educator/class-requests"
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          {t('educatorClassRequests.viewAll')} →
        </Link>
      </div>
    </div>
  );
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
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [logoPreview, setLogoPreview] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [approvalStatus, setApprovalStatus] = useState<{ status: string; reason?: string } | null>(null);
  const [reapplying, setReapplying] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [talents, setTalents] = useState<Talent[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const [certificatesIssued, setCertificatesIssued] = useState<number>(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { createCertificate, isLoading } = useCreateCertificate();
  const { toast } = useToast();
  const { data: pendingData } = usePendingClassRequestsCount();
  const pendingRequestsCount = pendingData?.count ?? 0;

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
    const loadProfile = async () => {
      try {
        const profile = await api.get<{
          organization_name: string;
          wallet_address: string;
          email: string | null;
          email_verified: boolean;
          photo_url: string | null;
        }>('/api/issuers/me');

        if (!profile.email_verified) {
          navigate('/verify-email');
          return;
        }

        setUserData({
          organization_name: profile.organization_name,
          walletAddress: profile.wallet_address,
          email: profile.email ?? "No email registered",
          role: "Educator",
          photo_url: profile.photo_url ?? null,
        });

        api.get<{ status: string; reason?: string }>('/api/issuers/me/status')
          .then((data) => {
            setApprovalStatus(data);
            const dismissed = sessionStorage.getItem('approval_banner_dismissed');
            if (!dismissed && (data.status === 'rejected' || data.status === 'pending_approval')) {
              setBannerVisible(true);
            }
          })
          .catch(() => {}); // non-blocking — dashboard still loads if status fails

        const certCount = await getCertificatesByEducator(profile.wallet_address);
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

  // Auto-dismiss the approval banner after 12 seconds and persist to sessionStorage
  // so it doesn't reappear on navigation within the same session.
  useEffect(() => {
    if (!bannerVisible) return;
    const timer = setTimeout(() => {
      setBannerVisible(false);
      sessionStorage.setItem('approval_banner_dismissed', '1');
    }, 12000);
    return () => clearTimeout(timer);
  }, [bannerVisible]);

  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const { isAdmin } = useAdminAccess();
  const deleteAccount = useDeleteAccount();

  const handleDeleteAccount = () => {
    if (!userData?.walletAddress) return;
    deleteAccount.mutate(userData.walletAddress, {
      onSuccess: () => {
        logout();
        queryClient.clear();
        try { appKit.disconnect(); } catch (_) { }
        toast({ title: "Account deleted", description: "Your educator account has been permanently deleted." });
        navigate('/');
      },
      onError: (error) => {
        setShowDeleteModal(false);
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  };

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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'logo' && e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setForm(prev => ({ ...prev, logo: URL.createObjectURL(file) }));
    } else {
      const { name, value } = e.target;
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleTalentChange = useCallback((walletAddress: string) => {
    const selectedTalent = talents.find(s => s.user.wallet_address === walletAddress);
    if (selectedTalent) {
      setForm(prev => ({
        ...prev,
        talentWallet: selectedTalent.user.wallet_address,
        talentName: selectedTalent.user.name,
      }));
    }
  }, [talents]);

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
        windowWidth: 1920, // Forces desktop layout inside the capture iframe to avoid mobile zoom issues
      });

      // Restauramos shine y glare después de capturar
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

    // Ocultamos shine y glare antes de capturar
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
      // Siempre restauramos shine y glare al terminar
      if (shine) shine.style.display = '';
      if (glare) glare.style.display = '';
      card.classList.remove('is-capturing');
    }
  };

  if (!userData) {
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
        organizationName={userData.organization_name ?? ""}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
        isPending={deleteAccount.isPending}
      />
      <Layout>
        <div className="min-h-screen relative font-body text-slate-200">
          <motion.main
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 px-4 sm:px-6 md:px-12 pt-8 sm:pt-12 pb-20 max-w-[1600px] mx-auto"
          >
            <AnimatePresence>
              {bannerVisible && approvalStatus?.status === 'rejected' && (
                <motion.div
                  key="banner-rejected"
                  initial={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.6, ease: 'easeOut' } }}
                  className="mb-8 relative overflow-hidden rounded-2xl border border-red-500/20 bg-black/40 backdrop-blur-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-950/40 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-red-500/60 via-red-400/20 to-transparent" />
                  <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-400 font-title tracking-wide mb-1">
                        {t('educatorDashboard.rejectedTitle')}
                      </p>
                      {approvalStatus.reason && (
                        <p className="text-xs text-slate-400 leading-relaxed font-body">{approvalStatus.reason}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      disabled={reapplying}
                      className="shrink-0 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/25 rounded-xl font-title tracking-wide text-xs h-9 px-5 transition-colors"
                      onClick={async () => {
                        setReapplying(true);
                        try {
                          await api.post('/api/issuers/me/reapply', {});
                          setApprovalStatus({ status: 'pending_approval' });
                          setBannerVisible(true);
                          sessionStorage.removeItem('approval_banner_dismissed');
                          toast({ title: t('educatorDashboard.reapplySuccess'), description: t('educatorDashboard.reapplySuccessDesc') });
                        } catch (e) {
                          toast({ title: t('educatorDashboard.reapplyError'), description: t('educatorDashboard.reapplyErrorDesc'), variant: 'destructive' });
                        } finally {
                          setReapplying(false);
                        }
                      }}
                    >
                      {reapplying ? t('educatorDashboard.reapplying') : t('educatorDashboard.reapplyBtn')}
                    </Button>
                  </div>
                </motion.div>
              )}
              {bannerVisible && approvalStatus?.status === 'pending_approval' && (
                <motion.div
                  key="banner-pending"
                  initial={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.6, ease: 'easeOut' } }}
                  className="mb-8 relative overflow-hidden rounded-2xl border border-white/8 bg-black/30 backdrop-blur-sm"
                >
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-purple-500/40 via-purple-400/10 to-transparent" />
                  <div className="relative px-6 py-4 flex items-center gap-4">
                    <div className="shrink-0 relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400/60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500/80" />
                    </div>
                    <p className="text-xs text-slate-400 font-body">
                      {t('educatorDashboard.pendingApproval')}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Header ── */}
            <header className="mb-8 grid grid-cols-2 md:grid-cols-3 items-center gap-4">

              <div className="flex flex-col">
                <p className="font-title text-[10px] sm:text-xs uppercase tracking-[0.22em] text-white/35 font-bold mb-1.5 sm:mb-3">
                  {t('educatorDashboard.roleName')}
                </p>
                <h1 className="font-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.02] mb-1 sm:mb-2">
                  <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(168,85,247,0.55)]">
                    {t('educatorDashboard.title')}
                  </span>
                </h1>
                <p className="hidden sm:block font-body text-base text-white/50 font-medium">
                  {t('educatorDashboard.subtitle')}
                </p>
              </div>

              <div className="hidden md:flex justify-center">
                <img src={HackChainLogo} alt="HackChain" className="h-16 md:h-20 object-contain" />
              </div>

              <div className="flex justify-end items-center gap-2">
                <LanguageToggle />

                {/* Notification bell — class requests popup */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors min-h-[36px] px-2 rounded-lg"
                      aria-label={`${t('educatorClassRequests.title')}${pendingRequestsCount > 0 ? ` (${pendingRequestsCount})` : ''}`}
                    >
                      <Bell className="h-[18px] w-[18px] shrink-0" />
                      {pendingRequestsCount > 0 && (
                        <span className="text-sm font-bold text-amber-400 tabular-nums leading-none">
                          {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
                        </span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 p-0 bg-slate-900/95 backdrop-blur-2xl border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.6)] rounded-2xl overflow-hidden"
                    align="end"
                    sideOffset={8}
                  >
                    <NotificationBellPanel />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-3 sm:px-5 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all cursor-pointer max-w-full"
                    >
                      <div className="flex flex-row items-center gap-1.5 overflow-hidden">
                        <span className="hidden sm:inline text-xs text-slate-400 font-medium whitespace-nowrap">{t('educatorDashboard.welcome')}</span>
                        <span className="text-sm font-bold text-white truncate max-w-[100px] sm:max-w-[140px]">
                          {userData.organization_name || t('educatorDashboard.roleName')}
                        </span>
                        {approvalStatus?.status === 'approved' && (
                          <BadgeCheck className="h-4 w-4 shrink-0 text-purple-400" />
                        )}
                      </div>
                      <EducatorAvatar photoUrl={userData?.photo_url ?? null} size="sm" />
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent
                    className="w-80 p-0 bg-slate-900/80 backdrop-blur-2xl border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.15)] rounded-2xl overflow-hidden relative"
                    align="end"
                    sideOffset={8}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none" />
                    <div className="p-6 space-y-4 relative z-10">
                      <div className="flex items-center gap-4 pb-4 border-b border-purple-500/20">
                        <EducatorAvatar photoUrl={userData?.photo_url ?? null} size="md" />
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-title text-base font-bold text-white truncate">
                              {userData.organization_name || "My Organization"}
                            </h3>
                            {approvalStatus?.status === 'approved' && (
                              <BadgeCheck className="h-4 w-4 shrink-0 text-purple-400" />
                            )}
                          </div>
                          <p className="text-xs text-purple-400 font-medium">{userData.role || t('educatorDashboard.roleName')}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-colors">
                          <img src="/icons/documento.avif" className="h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1">{t('educatorDashboard.certificatesIssued')}</p>
                            <p className="text-sm text-slate-200">{certificatesIssued > 0 ? certificatesIssued : t('educatorDashboard.noneYet')}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-colors">
                          <img src="/icons/maletinNeon.avif" className="h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1">{t('educatorDashboard.roleLabel')}</p>
                            <p className="text-sm text-slate-200">{t('educatorDashboard.roleName')}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-colors">
                          <img src="/icons/wallet.avif" className="h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1">{t('educatorDashboard.walletLabel')}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-slate-200 font-mono truncate">
                                {userData.walletAddress ? `${userData.walletAddress.slice(0, 6)}…${userData.walletAddress.slice(-4)}` : "—"}
                              </p>
                              {userData.walletAddress && (
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(userData.walletAddress);
                                    setCopiedWallet(true);
                                    setTimeout(() => setCopiedWallet(false), 2000);
                                  }}
                                  className="shrink-0 text-slate-500 hover:text-purple-400 transition-colors"
                                  title="Copiar wallet"
                                >
                                  {copiedWallet
                                    ? <Check className="h-3.5 w-3.5 text-emerald-400" />
                                    : <Copy className="h-3.5 w-3.5" />
                                  }
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        {userData.email && (
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-colors">
                            <img src="/icons/mail.avif" className="h-8 w-8 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1">{t('educatorDashboard.emailLabel', 'Correo')}</p>
                              <p className="text-sm text-slate-200 font-mono">
                                {(() => {
                                  const [name, domain] = userData.email.split('@');
                                  return name && domain ? `${name.slice(0, 2)}***@${domain}` : userData.email;
                                })()}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <Link to="/educator/class-requests" className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-colors">
                          <img src="/icons/maletinNeon.avif" className="h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1">{t('educatorClassRequests.title')}</p>
                            <p className="text-sm text-slate-200">
                              {pendingRequestsCount > 0
                                ? `${pendingRequestsCount} ${t('educatorClassRequests.tabs.pending').toLowerCase()}`
                                : t('educatorDashboard.noneYet')}
                            </p>
                          </div>
                        </Link>

                        {isAdmin && (
                          <Link to="/admin" className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-colors">
                            <img src="/icons/escudoNeon.avif" className="h-5 w-6 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1">Admin</p>
                              <p className="text-sm text-slate-200">Panel de Administración</p>
                            </div>
                          </Link>
                        )}
                      </div>

                      <div className="pt-4 border-t border-purple-500/20 space-y-2">
                        <Button
                          onClick={() => navigate('/educator/profile/edit')}
                          variant="outline"
                          className="w-full border-purple-500/20 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/30"
                        >
                          <img src="/icons/editProfile.avif" className="h-4 w-4 mr-2 object-contain drop-shadow-md" />
                          Edit profile
                        </Button>
                        <Button
                          onClick={handleLogout}
                          variant="outline"
                          className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30"
                        >
                          <img src="/icons/logout.avif" className="h-5 w-5 mr-2 object-contain drop-shadow-md" />
                          {t('educatorDashboard.logout')}
                        </Button>
                        <Button
                          onClick={() => setShowDeleteModal(true)}
                          variant="ghost"
                          className="w-full text-slate-500 hover:text-red-400 hover:bg-red-500/5 text-xs"
                        >
                          <img src="/icons/delete.avif" className="h-5 w-5 mr-2 object-contain drop-shadow-md" />
                          Delete account
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </header>

            {/* ── Stat chips ── */}
            <div className="flex flex-wrap gap-3 mb-10">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
                <div className="h-8 w-8 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
                  <img src="/icons/medalla.avif" className="h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                </div>
                <div>
                  <p className="font-title text-[10px] uppercase tracking-[0.18em] text-white/30 font-bold leading-none mb-1">
                    {t('educatorDashboard.certificatesIssued')}
                  </p>
                  <p className="font-title text-lg font-black text-white leading-none">{certificatesIssued}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
                <div className="h-8 w-8 rounded-xl bg-fuchsia-500/15 flex items-center justify-center shrink-0">
                  <img src="/icons/talentsPlattform.avif" className="h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" />
                </div>
                <div>
                  <p className="font-title text-[10px] uppercase tracking-[0.18em] text-white/30 font-bold leading-none mb-1">
                    {t('educatorDashboard.talentsAvailable', 'Talentos en plataforma')}
                  </p>
                  <p className="font-title text-lg font-black text-white leading-none">{talents.length}</p>
                </div>
              </div>
            </div>

            {/* ── Main grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left: Form */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.2 }}
                className="lg:col-span-5 order-2 lg:order-1"
              >
                <div className="relative overflow-hidden bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
                  <div className="absolute -top-24 -right-24 w-56 h-56 bg-purple-500/10 rounded-full blur-[70px] pointer-events-none" />

                  <div className="relative z-10 mb-6">
                    <p className="font-title text-[10px] uppercase tracking-[0.22em] text-purple-400/70 font-bold mb-1.5">
                      {t('educatorDashboard.formTitle')}
                    </p>
                    <p className="font-body text-sm text-white/40">{t('educatorDashboard.formSubtitle')}</p>
                  </div>

                  <form className="relative z-10 space-y-5">
                    <div className="space-y-4">
                      <div className="group/input">
                        <Label htmlFor="certificateTitle" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1.5 block group-focus-within/input:text-purple-400 transition-colors">
                          {t('educatorDashboard.fieldCertTitle')}
                        </Label>
                        <Input
                          id="certificateTitle"
                          name="certificateTitle"
                          value={form.certificateTitle}
                          onChange={handleChange}
                          placeholder={t('educatorDashboard.fieldCertTitlePlaceholder')}
                          className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl h-11 transition-all"
                        />
                      </div>

                      <div className="group/input">
                        <Label htmlFor="talentName" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1.5 block group-focus-within/input:text-purple-400 transition-colors">
                          {t('educatorDashboard.fieldTalentName')}
                        </Label>
                        <Select onValueChange={handleTalentChange} value={form.talentWallet}>
                          <SelectTrigger className="w-full bg-black/20 border-white/10 text-white rounded-xl h-11">
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
                        <p className="text-[10px] text-slate-600 mt-1.5 pl-1 font-mono">
                          {t('educatorDashboard.selectedWallet')} {form.talentWallet || t('educatorDashboard.selectedWalletNone')}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="group/input">
                          <Label htmlFor="issuer" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1.5 block group-focus-within/input:text-purple-400 transition-colors">
                            {t('educatorDashboard.fieldIssuer')}
                          </Label>
                          <Input
                            id="issuer"
                            name="issuer"
                            value={form.issuer}
                            onChange={handleChange}
                            placeholder={t('educatorDashboard.fieldIssuerPlaceholder')}
                            className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl h-11 transition-all"
                          />
                        </div>
                        <div className="group/input">
                          <Label htmlFor="issueDate" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1.5 block group-focus-within/input:text-purple-400 transition-colors">
                            {t('educatorDashboard.fieldDate')}
                          </Label>
                          <Input
                            id="issueDate"
                            name="issueDate"
                            type="date"
                            value={form.issueDate}
                            onChange={handleChange}
                            className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl h-11 transition-all [color-scheme:dark]"
                          />
                        </div>
                      </div>

                      <div className="group/input">
                        <Label htmlFor="certificateType" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1.5 block group-focus-within/input:text-purple-400 transition-colors">
                          {t('educatorDashboard.fieldType')}
                        </Label>
                        <Input
                          id="certificateType"
                          name="certificateType"
                          value={form.certificateType}
                          onChange={handleChange}
                          placeholder={t('educatorDashboard.fieldTypePlaceholder')}
                          className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl h-11 transition-all"
                        />
                      </div>

                      <div className="group/input">
                        <Label htmlFor="logo" className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1.5 block group-focus-within/input:text-purple-400 transition-colors">
                          {t('educatorDashboard.fieldLogo')}
                        </Label>
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

                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        onClick={handleCreateCertificate}
                        disabled={isLoading}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-purple-900/40 border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {t('educatorDashboard.creating')}
                          </span>
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

              {/* Right: Preview */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.4 }}
                className="lg:col-span-7 order-1 lg:order-2 lg:sticky lg:top-8"
              >
                <div className="relative overflow-hidden bg-white/[0.02] backdrop-blur-sm border border-white/[0.07] rounded-[28px] sm:rounded-[40px] p-5 sm:p-8 lg:p-10 flex flex-col items-center justify-center min-h-[380px] lg:min-h-[620px]">
                  <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/10 rounded-full blur-[90px] pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-56 h-56 bg-fuchsia-500/10 rounded-full blur-[70px] pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/30 to-transparent" />

                  <div className="absolute top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md">
                    <span className="font-title text-[10px] font-bold tracking-[0.22em] uppercase text-white/30">
                      {t('educatorDashboard.livePreview')}
                    </span>
                  </div>

                  <div className="transform transition-transform hover:scale-[1.02] duration-500 relative z-10" ref={cardRef}>
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

                  <div className="mt-5 text-center max-w-md relative z-10">
                    <p className="font-title text-[10px] uppercase tracking-[0.22em] text-white/25 font-bold mb-1.5">
                      {t('educatorDashboard.reviewTitle')}
                    </p>
                    <p className="font-body text-sm text-white/35">
                      {t('educatorDashboard.reviewDesc')}
                    </p>
                  </div>
                </div>
              </motion.div>

            </div>

            <ReferralsSection />
          </motion.main>
        </div>
      </Layout>
    </>
  );
};

export default EducatorDashboard;

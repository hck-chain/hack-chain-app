import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Loader2, ExternalLink } from 'lucide-react';
import Layout from '@/components/Layout';
import { AnimeParticles } from '@/components/animations/AnimeComponents';
import { CoverAnimation } from '@/components/CoverAnimation/CoverAnimation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { KnowledgeAreasSelector } from '@/components/KnowledgeAreasSelector/KnowledgeAreasSelector';
import { useMyEducatorProfile } from '@/hooks/useMyEducatorProfile';
import { useUpdateEducatorProfile, useUpdateEducatorPhoto, useDeleteEducatorPhoto } from '@/hooks/useUpdateEducatorProfile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from 'react-i18next';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function compressImage(file: File, maxPx = 600, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file),
        'image/jpeg',
        quality
      );
    };
    img.src = objectUrl;
  });
}

function resolveIpfs(url: string | null): string {
  if (!url) return '';
  if (url.startsWith('ipfs://')) {
    const cid = url.slice('ipfs://'.length);
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
  return url;
}

function initials(org: string): string {
  return org.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function profileCompletion(org: string, bio: string, areas: string[], photo: string | null): number {
  let score = 0;
  if (org.trim()) score += 25;
  if (bio.trim().length > 20) score += 35;
  if (areas.length >= 1) score += 25;
  if (photo) score += 15;
  return score;
}

function missingSections(org: string, bio: string, areas: string[], photo: string | null, t: any): string[] {
  const missing: string[] = [];
  if (!org.trim()) missing.push(`${t('editProfile.missingOrgTitle')} — ${t('editProfile.missingOrgDesc')}`);
  if (bio.trim().length <= 20) missing.push(`${t('editProfile.missingBioTitle')} — ${t('editProfile.missingBioDesc')}`);
  if (areas.length === 0) missing.push(`${t('editProfile.missingAreasTitle')} — ${t('editProfile.missingAreasDesc')}`);
  if (!photo) missing.push(`${t('editProfile.missingPhotoTitle')} — ${t('editProfile.missingPhotoDesc')}`);
  return missing;
}

// ---------------------------------------------------------------------------
// Section divider
// ---------------------------------------------------------------------------

interface SectionDividerProps {
  label: string;
  accentColor: string;
}

function SectionDivider({ label, accentColor }: SectionDividerProps) {
  return (
    <div className="flex items-center gap-5 my-14">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      <div className="flex items-center gap-3">
        <span className={`font-title text-[10px] uppercase tracking-[0.3em] font-black ${accentColor}`}>{label}</span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const EditEducatorProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isPending: isLoadingProfile } = useMyEducatorProfile();
  const updateProfile = useUpdateEducatorProfile();
  const updatePhoto = useUpdateEducatorPhoto();
  const deletePhoto = useDeleteEducatorPhoto();

  const [organizationName, setOrganizationName] = useState('');
  const [bio, setBio] = useState('');
  const [knowledgeAreas, setKnowledgeAreas] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isPhotoMarkedForDeletion, setIsPhotoMarkedForDeletion] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setOrganizationName(profile.organization_name ?? '');
    setBio(profile.bio ?? '');
    setKnowledgeAreas(profile.knowledge_areas ?? []);
    setPhotoPreview(resolveIpfs(profile.photo_url));
  }, [profile]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return previewUrl;
    });
    setIsPhotoMarkedForDeletion(false);
    setIsCompressing(true);
    const compressed = await compressImage(file);
    setIsCompressing(false);

    try {
      const ipfsUrl = await updatePhoto.mutateAsync(compressed);
      setPhotoPreview((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return resolveIpfs(ipfsUrl);
      });
    } catch (err: unknown) {
      setPhotoPreview((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return resolveIpfs(profile?.photo_url ?? null);
      });
      const message = err instanceof Error ? err.message : 'Could not upload photo';
      toast({ title: 'Error uploading photo', description: message, variant: 'destructive' });
    }
  };

  const handleDeletePhotoIntent = () => {
    setPhotoPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
    setIsPhotoMarkedForDeletion(true);
  };

  const handleSaveIntent = () => {
    if (isSaving) return;
    const missing = missingSections(organizationName, bio, knowledgeAreas, photoPreview, t);
    if (missing.length > 0) {
      setShowIncompleteDialog(true);
    } else {
      void handleSave();
    }
  };

  const handleSave = async () => {
    setShowIncompleteDialog(false);
    if (isSaving) return;
    try {
      if (isPhotoMarkedForDeletion) {
        await deletePhoto.mutateAsync();
        setIsPhotoMarkedForDeletion(false);
      }
      await updateProfile.mutateAsync({
        organization_name: organizationName.trim() || undefined,
        bio: bio.trim() || undefined,
        knowledge_areas: knowledgeAreas,
      });
      toast({ title: t('editProfile.savedTitle'), description: t('editProfile.savedDesc') });

      if (!profile?.email_verified) {
        navigate('/verify-email');
      } else {
        navigate('/educator/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast({ title: t('editProfile.errorTitle'), description: message, variant: 'destructive' });
    }
  };

  const isSaving = updateProfile.isPending || updatePhoto.isPending || deletePhoto.isPending;
  const completion = profileCompletion(organizationName, bio, knowledgeAreas, photoPreview);
  const wallet = profile?.wallet_address ?? '';

  if (isLoadingProfile) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen font-body text-slate-200 flex flex-col">

        {/* ── Sticky top bar ── */}
        <div className="sticky top-0 z-20 backdrop-blur-xl bg-[#050508]/80 border-b border-white/[0.05]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <button
              onClick={() => navigate('/educator/dashboard')}
              className="flex items-center gap-2 text-white/35 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t('editProfile.backToDashboard')}</span>
            </button>
            <img src="/favicon.ico" alt="HackChain" className="h-7 w-7 object-contain" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="flex-1"
        >
          {/* ── Cover ── */}
          <div className="relative w-full h-40 sm:h-48 overflow-hidden bg-[#07070f]">
            <CoverAnimation />
            <AnimeParticles />

            {/* Completion bar */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-white/[0.05]">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-rose-500"
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>

            {/* Completion badge */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/[0.07]">
              <div className={`h-1.5 w-1.5 rounded-full ${completion === 100 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-[11px] font-mono text-white/40">{completion}{t('editProfile.completion')}</span>
            </div>
          </div>

          {/* ── Main content ── */}
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pb-28 overflow-hidden">

            {/* Ambient glow — identity area */}
            <div className="pointer-events-none absolute -top-20 -left-32 w-[500px] h-[400px] rounded-full bg-purple-600/[0.13] blur-[100px]" />
            <div className="pointer-events-none absolute -top-20 right-0 w-[300px] h-[300px] rounded-full bg-fuchsia-500/[0.08] blur-[90px]" />

            {/* ── Identity block ── */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 pt-10 mb-2">

              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl ring-4 ring-[#050508] overflow-hidden shadow-2xl shadow-black/60">
                  <Avatar className="h-full w-full rounded-2xl">
                    <AvatarImage src={photoPreview ?? undefined} alt={organizationName} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 via-fuchsia-600 to-rose-700 text-white font-title font-black text-2xl rounded-none">
                      {initials(organizationName || '?')}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      disabled={isSaving}
                      className="absolute -bottom-2 -right-2 h-7 w-7 rounded-xl bg-purple-600 hover:bg-fuchsia-500 border-2 border-[#050508] flex items-center justify-center transition-colors disabled:opacity-50 shadow-lg shadow-purple-900/50"
                    >
                      <Camera className="h-3.5 w-3.5 text-white" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40 z-50">
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                      {t('editProfile.uploadNewPhoto')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDeletePhotoIntent}
                      disabled={!photoPreview}
                      className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                    >
                      {t('editProfile.removePhoto')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={isSaving} />
              </div>

              {/* Name — editable headline */}
              <div className="flex-1 min-w-0 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[10px] font-title font-black uppercase tracking-[0.24em] text-purple-400">
                    {t('editProfile.educatorRole')}
                  </span>
                  {isCompressing && (
                    <span className="text-[11px] text-fuchsia-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
                      {t('editProfile.optimizing')}
                    </span>
                  )}
                  {updatePhoto.isPending && !isCompressing && (
                    <span className="text-[11px] text-purple-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                      {t('editProfile.uploading')}
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  disabled={isSaving}
                  maxLength={255}
                  placeholder={t('editProfile.orgPlaceholder')}
                  className="w-full bg-transparent border-0 outline-none font-title font-black text-3xl sm:text-4xl text-white placeholder:text-white/15 disabled:opacity-60 leading-tight"
                />

                <div className="flex items-center gap-4 mt-2">
                  {wallet && (
                    <span className="text-xs font-mono text-white/20">
                      {wallet.slice(0, 6)}…{wallet.slice(-4)}
                    </span>
                  )}
                  {wallet && (
                    <button
                      onClick={() => navigate(`/educator/${wallet}`)}
                      className="flex items-center gap-1 text-xs text-white/25 hover:text-white/60 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {t('editProfile.viewPublicProfile')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Bio ── */}
            <SectionDivider
              label={t('editProfile.bioSection')}
              accentColor="text-emerald-400/80"
            />

            {/* Ambient glow — bio area */}
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-emerald-500/[0.07] blur-[110px]" style={{ top: '480px' }} />

            <div className="space-y-3">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={isSaving}
                maxLength={500}
                rows={6}
                placeholder={t('editProfile.bioPlaceholder')}
                className="w-full bg-black/20 border border-white/10 focus:border-emerald-500/30 rounded-xl outline-none resize-none font-body text-lg text-white/70 placeholder:text-white/15 leading-relaxed p-4 shadow-none ring-0 focus-visible:ring-0 transition-colors"
              />
              <div className="flex justify-end">
                <span className={`text-xs font-mono ${bio.length > 450 ? 'text-amber-400' : 'text-white/15'}`}>
                  {bio.length} / 500
                </span>
              </div>
            </div>

            {/* ── Knowledge areas ── */}
            <SectionDivider
              label={t('editProfile.areasSection')}
              accentColor="text-amber-400/80"
            />

            {/* Ambient glow — expertise area */}
            <div className="pointer-events-none absolute -right-40 w-[500px] h-[400px] rounded-full bg-rose-500/[0.08] blur-[110px]" style={{ top: '900px' }} />
            <div className="pointer-events-none absolute -left-40 w-[400px] h-[300px] rounded-full bg-amber-500/[0.06] blur-[100px]" style={{ top: '1000px' }} />

            <KnowledgeAreasSelector
              selected={knowledgeAreas}
              onChange={setKnowledgeAreas}
              disabled={isSaving}
            />

            {/* ── Account info ── */}
            <SectionDivider
              label={t('editProfile.accountSection')}
              accentColor="text-cyan-400/80"
            />

            {/* Ambient glow — account area */}
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full bg-cyan-500/[0.07] blur-[100px]" style={{ top: '1500px' }} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
              {/* Role */}
              <div className="bg-[#050508] px-6 py-6 flex flex-col gap-4">
                <img src="/icons/maletinNeon.avif" alt="Role" className="h-5 w-5 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]" />
                <div>
                  <p className="text-[10px] font-title font-black uppercase tracking-[0.24em] text-purple-400/50 mb-2">{t('editProfile.roleLabel')}</p>
                  <p className="text-sm font-mono text-white/50">
                    {t('editProfile.educatorRole')}
                  </p>
                </div>
              </div>

              {/* Wallet */}
              <div className="bg-[#050508] px-6 py-6 flex flex-col gap-4">
                <img src="/icons/wallet.avif" alt="Wallet" className="h-5 w-5 object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]" />
                <div>
                  <p className="text-[10px] font-title font-black uppercase tracking-[0.24em] text-cyan-400/50 mb-2">{t('editProfile.walletLabel')}</p>
                  <p className="text-sm font-mono text-white/50">
                    {wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : '—'}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="bg-[#050508] px-6 py-6 flex flex-col gap-4">
                <img src="/icons/mail.avif" alt="Email" className="h-5 w-5 object-contain drop-shadow-[0_0_12px_rgba(244,114,182,0.5)]" />
                <div>
                  <p className="text-[10px] font-title font-black uppercase tracking-[0.24em] text-rose-400/50 mb-2">{t('editProfile.emailLabel')}</p>
                  <p className="text-sm font-mono text-white/50">
                    {(() => {
                      if (!profile?.email) return '—';
                      const [name, domain] = profile.email.split('@');
                      return name && domain ? `${name.slice(0, 2)}***@${domain}` : profile.email;
                    })()}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* ── Incomplete profile dialog ── */}
        <AlertDialog open={showIncompleteDialog} onOpenChange={setShowIncompleteDialog}>
          <AlertDialogContent className="bg-[#0a0a12]/95 border-white/[0.07] backdrop-blur-xl max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <img src="/icons/warning.avif" alt="Warning" className="h-5 w-5 object-contain" />
                </div>
                <AlertDialogTitle className="font-title font-black text-white tracking-tight">
                  {t('editProfile.missingDialogTitle')}
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm text-white/40">
                  <p>{t('editProfile.missingDialogDesc')}</p>
                  <ul className="space-y-2">
                    {missingSections(organizationName, bio, knowledgeAreas, photoPreview, t).map((item) => {
                      const [title, desc] = item.split(' — ');
                      return (
                        <li key={title} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/10">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span>
                            <span className="text-white/75 font-medium">{title}</span>
                            {desc && <span className="text-white/25"> — {desc}</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-white/20 text-xs pt-1">
                    {t('editProfile.completeProfileHint')}
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 mt-2">
              <AlertDialogCancel className="border-white/[0.07] text-white/35 hover:text-white hover:bg-white/[0.04] bg-transparent">
                {t('editProfile.keepEditing')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSave}
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white border-0 shadow-lg shadow-purple-900/40"
              >
                {t('editProfile.saveAnyway')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Footer ── */}
        <footer className="sticky bottom-0 border-t border-white/[0.05] bg-[#050508]/85 backdrop-blur-xl z-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <p className="text-xs text-white/20 hidden sm:block">
              {t('editProfile.savedChangesNote')}
            </p>
            <Button
              onClick={handleSaveIntent}
              disabled={isSaving}
              className="ml-auto bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-title font-black px-8 rounded-full shadow-lg shadow-purple-900/40 transition-all hover:scale-[1.02]"
            >
              {isSaving
                ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />{t('editProfile.saving')}</>
                : <><img src="/icons/guardar.avif" className="mr-2 h-4 w-4 object-contain" alt="" />{t('editProfile.saveBtn')}</>
              }
            </Button>
          </div>
        </footer>
      </div>
    </Layout>
  );
};

export default EditEducatorProfile;

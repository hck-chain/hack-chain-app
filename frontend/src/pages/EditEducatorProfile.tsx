import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Camera, Loader2, Save,
  GraduationCap, BookOpen, User, Shield, ExternalLink, AlertTriangle,
  Mail, Wallet, Briefcase
} from 'lucide-react';
import Layout from '@/components/Layout';
import { AnimeParticles } from '@/components/animations/AnimeComponents';
import { CoverAnimation } from '@/components/CoverAnimation/CoverAnimation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useUpdateEducatorProfile, useUpdateEducatorPhoto } from '@/hooks/useUpdateEducatorProfile';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function missingSections(org: string, bio: string, areas: string[], photo: string | null): string[] {
  const missing: string[] = [];
  if (!org.trim()) missing.push('Organization name — recruiters and talents need to know who you are.');
  if (bio.trim().length <= 20) missing.push('Bio — tell talents about your background and what you teach.');
  if (areas.length === 0) missing.push('Knowledge areas — help talents find you by your expertise.');
  if (!photo) missing.push('Profile photo — profiles with a photo get significantly more views.');
  return missing;
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ icon: Icon, title, children }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border-2 border-white/30 shadow-lg">
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />
      <AnimeParticles />
      <div className="relative z-10 flex items-center gap-2.5 px-6 py-4 border-b-2 border-white/30">
        <Icon className="h-4 w-4 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
        <span className="text-base font-bold text-white drop-shadow-md">{title}</span>
      </div>
      <div className="relative z-10 p-6">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const EditEducatorProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isPending: isLoadingProfile } = useMyEducatorProfile();
  const updateProfile = useUpdateEducatorProfile();
  const updatePhoto = useUpdateEducatorPhoto();

  const [organizationName, setOrganizationName] = useState('');
  const [bio, setBio] = useState('');
  const [knowledgeAreas, setKnowledgeAreas] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setOrganizationName(profile.organization_name ?? '');
    setBio(profile.bio ?? '');
    setKnowledgeAreas(profile.knowledge_areas ?? []);
    setPhotoPreview(resolveIpfs(profile.photo_url));
  }, [profile]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSaveIntent = () => {
    if (isSaving) return;
    const missing = missingSections(organizationName, bio, knowledgeAreas, photoPreview);
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
      if (pendingPhotoFile) {
        await updatePhoto.mutateAsync(pendingPhotoFile);
        setPendingPhotoFile(null);
      }
      await updateProfile.mutateAsync({
        organization_name: organizationName.trim() || undefined,
        bio: bio.trim() || undefined,
        knowledge_areas: knowledgeAreas,
      });
      toast({ title: 'Profile saved', description: 'Your public profile has been updated.' });

      if (!profile?.email_verified) {
        navigate('/verify-email');
      } else {
        navigate('/educator/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const isSaving = updateProfile.isPending || updatePhoto.isPending;
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
        <div className="sticky top-0 z-20 backdrop-blur-xl bg-slate-950/70 border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <button
              onClick={() => navigate('/educator/dashboard')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to dashboard</span>
            </button>

            <img src="/favicon.ico" alt="HackChain" className="h-7 w-7 object-contain" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex-1"
        >
          {/* ── Cover / Hero ── */}
          <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-[#07070f]">
            <CoverAnimation />

            {/* Completion bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            </div>

            {/* Completion badge */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <div className={`h-1.5 w-1.5 rounded-full ${completion === 100 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-xs font-mono text-slate-300">{completion}% complete</span>
            </div>
          </div>

          {/* ── Profile identity ── */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="relative flex flex-col sm:flex-row sm:items-end gap-4 -mt-8 pt-2 mb-8">

              {/* Avatar */}
              <div className="relative shrink-0 self-start">
                <div className="h-24 w-24 rounded-xl ring-4 ring-[#07070f] overflow-hidden">
                  <Avatar className="h-full w-full rounded-xl">
                    <AvatarImage src={photoPreview ?? undefined} alt={organizationName} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-2xl rounded-none">
                      {initials(organizationName || '?')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-lg bg-purple-600 hover:bg-purple-500 border-2 border-[#07070f] flex items-center justify-center transition-colors disabled:opacity-50 shadow-lg"
                  title="Change photo"
                >
                  <Camera className="h-3.5 w-3.5 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                  disabled={isSaving}
                />
              </div>

              {/* Name + meta */}
              <div className="sm:mb-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-white truncate">
                    {organizationName || <span className="text-slate-500 italic font-normal">Your organization name</span>}
                  </h1>
                  <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/25 text-[10px] px-2 rounded-full">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Educator
                  </Badge>
                </div>
                {wallet && (
                  <p className="text-xs font-mono text-slate-500">
                    {wallet.slice(0, 6)}…{wallet.slice(-4)}
                  </p>
                )}
                {pendingPhotoFile && (
                  <p className="text-[11px] text-purple-400 mt-1">New photo ready — will upload on save.</p>
                )}
              </div>

              {wallet && (
                <button
                  onClick={() => navigate(`/educator/${wallet}`)}
                  className="group shrink-0 sm:mb-2 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View public profile
                </button>
              )}
            </div>

            {/* ── Form grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 pb-24">

              {/* Left col */}
              <div className="lg:col-span-2 space-y-5">
                <Section icon={User} title="Organization">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-white drop-shadow-md">Name</Label>
                    <Input
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      disabled={isSaving}
                      maxLength={255}
                      placeholder="School, company or institution"
                      className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 h-10"
                    />
                  </div>
                </Section>

                <Section icon={Shield} title="Account">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-colors">
                      <Briefcase className="h-4 w-4 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs uppercase text-white font-bold tracking-wider mb-1 drop-shadow-md">Role</p>
                        <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/20 text-[10px]">Educator</Badge>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-colors">
                      <Wallet className="h-4 w-4 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase text-white font-bold tracking-wider mb-1 drop-shadow-md">Wallet</p>
                        <p className="text-sm text-slate-200 font-mono">
                          {wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-colors">
                      <Mail className="h-4 w-4 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase text-white font-bold tracking-wider mb-1 drop-shadow-md">Email</p>
                        <p className="text-sm text-slate-200 font-mono">
                          {(() => {
                            if (!profile?.email) return '—';
                            const [name, domain] = profile.email.split('@');
                            return name && domain ? `${name.slice(0, 2)}***@${domain}` : profile.email;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Section>
              </div>

              {/* Right col */}
              <div className="lg:col-span-3 space-y-5">
                <Section icon={User} title="Bio">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-white drop-shadow-md">Bio</Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      disabled={isSaving}
                      maxLength={500}
                      rows={5}
                      placeholder="Tell talents what you teach, your background, and what makes you stand out…"
                      className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 resize-none text-sm leading-relaxed"
                    />
                    <div className="flex justify-end">
                      <span className={`text-xs font-mono ${bio.length > 450 ? 'text-amber-400' : 'text-slate-600'}`}>
                        {bio.length}/500
                      </span>
                    </div>
                  </div>
                </Section>

                <Section icon={BookOpen} title="Knowledge areas">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-white drop-shadow-md">Select your knowledge areas</Label>
                    <KnowledgeAreasSelector
                      selected={knowledgeAreas}
                      onChange={setKnowledgeAreas}
                      disabled={isSaving}
                    />
                  </div>
                </Section>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Incomplete profile dialog ── */}
        <AlertDialog open={showIncompleteDialog} onOpenChange={setShowIncompleteDialog}>
          <AlertDialogContent className="bg-slate-900/95 border-white/10 backdrop-blur-xl max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-400" />
                </div>
                <AlertDialogTitle className="text-white text-base">
                  Your profile is incomplete
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm text-slate-400">
                  <p>You're missing the following sections:</p>
                  <ul className="space-y-2">
                    {missingSections(organizationName, bio, knowledgeAreas, photoPreview).map((item) => {
                      const [title, desc] = item.split(' — ');
                      return (
                        <li key={title} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span>
                            <span className="text-slate-200 font-medium">{title}</span>
                            {desc && <span className="text-slate-500"> — {desc}</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-slate-500 text-xs pt-1">
                    A complete profile gets more visibility with talents and recruiters.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 mt-2">
              <AlertDialogCancel className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5 bg-transparent">
                Keep editing
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSave}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0"
              >
                Save anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Footer ── */}
        <footer className="sticky bottom-0 border-t border-white/[0.06] bg-slate-950/80 backdrop-blur-xl z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <p className="text-xs text-slate-600 hidden sm:block">
              Changes are reflected on your public profile immediately after saving.
            </p>
            <Button
              onClick={handleSaveIntent}
              disabled={isSaving}
              className="ml-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-8 rounded-full shadow-lg shadow-purple-900/40 transition-all hover:scale-[1.02]"
            >
              {isSaving
                ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</>
                : <><Save className="mr-2 h-3.5 w-3.5" />Save profile</>
              }
            </Button>
          </div>
        </footer>
      </div>
    </Layout>
  );
};

export default EditEducatorProfile;

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Loader2,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  X,
  ExternalLink,
} from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { KnowledgeAreasSelector } from "@/components/KnowledgeAreasSelector/KnowledgeAreasSelector";
import { useMyTalentProfile } from "@/hooks/useMyTalentProfile";
import {
  useUpdateTalentProfile,
  useUpdateTalentPhoto,
  useDeleteTalentPhoto,
} from "@/hooks/useUpdateTalentProfile";
import { useTranslation } from "react-i18next";
import { P } from "@/components/profile/palette";
import { GrainOverlay } from "@/components/profile/GrainOverlay";
import { resolveIpfs } from "@/lib/ipfs";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function compressImage(
  file: File,
  maxPx = 600,
  quality = 0.85,
): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas
        .getContext("2d")!
        .drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) =>
          resolve(
            blob ? new File([blob], file.name, { type: "image/jpeg" }) : file,
          ),
        "image/jpeg",
        quality,
      );
    };
    img.src = objectUrl;
  });
}

function initials(name: string | null, lastname: string | null): string {
  const source = [name, lastname].filter(Boolean).join(" ");
  return source
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function isValidUrl(v: string): boolean {
  if (!v.trim()) return true;
  return /^https?:\/\/[^\s<>"']+$/i.test(v.trim());
}

function profileCompletion(
  name: string,
  bio: string,
  areas: string[],
  photo: string | null,
): number {
  let score = 0;
  if (name.trim()) score += 25;
  if (bio.trim().length > 20) score += 35;
  if (areas.length >= 1) score += 25;
  if (photo) score += 15;
  return score;
}

function missingSections(
  name: string,
  bio: string,
  areas: string[],
  photo: string | null,
  t: (k: string) => string,
): string[] {
  const missing: string[] = [];
  if (!name.trim())
    missing.push(
      `${t("editProfile.missingNameTitle")} — ${t("editProfile.missingNameDesc")}`,
    );
  if (bio.trim().length <= 20)
    missing.push(
      `${t("editProfile.missingBioTitle")} — ${t("editProfile.missingBioDesc")}`,
    );
  if (areas.length === 0)
    missing.push(
      `${t("editProfile.missingAreasTitle")} — ${t("editProfile.missingAreasDesc")}`,
    );
  if (!photo)
    missing.push(
      `${t("editProfile.missingPhotoTitle")} — ${t("editProfile.missingPhotoDesc")}`,
    );
  return missing;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section card
// ─────────────────────────────────────────────────────────────────────────────

interface SectionCardProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}

function SectionCard({
  label,
  description,
  children,
  trailing,
}: SectionCardProps) {
  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: P.card, border: `1px solid ${P.border}` }}
    >
      <header
        className="flex items-start justify-between gap-4 px-6 py-5"
        style={{ borderBottom: `1px solid ${P.borderSub}` }}
      >
        <div className="min-w-0">
          <h2
            className="text-[11px] uppercase tracking-[0.18em] font-semibold"
            style={{ color: P.textMuted }}
          >
            {label}
          </h2>
          {description && (
            <p className="text-sm mt-1.5" style={{ color: P.textSecondary }}>
              {description}
            </p>
          )}
        </div>
        {trailing}
      </header>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Social input
// ─────────────────────────────────────────────────────────────────────────────

interface SocialInputProps {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

function SocialInput({
  icon,
  label,
  placeholder,
  value,
  onChange,
  disabled,
}: SocialInputProps) {
  const [focused, setFocused] = useState(false);
  const valid = isValidUrl(value);
  const showError = !focused && value.trim().length > 0 && !valid;

  return (
    <div>
      <label
        className="block text-[11px] uppercase tracking-[0.16em] font-semibold mb-2"
        style={{ color: P.textMuted }}
      >
        {label}
      </label>
      <div
        className="flex items-center rounded-xl transition-colors"
        style={{
          backgroundColor: P.surface,
          border: `1px solid ${focused ? P.borderFocus : showError ? "oklch(0.65 0.18 25 / 0.55)" : P.border}`,
        }}
      >
        <div
          className="flex items-center justify-center pl-3.5 pr-2.5 shrink-0"
          style={{ color: P.textMuted }}
        >
          {icon}
        </div>
        <input
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          maxLength={500}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent border-0 outline-none py-3 pr-3.5 text-[15px] disabled:opacity-50"
          style={{ color: P.textPrimary }}
        />
      </div>
      {showError && (
        <p className="mt-1.5 text-xs" style={{ color: "oklch(0.75 0.16 25)" }}>
          debe comenzar con http:// o https://
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const EditTalentProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isPending: isLoadingProfile } = useMyTalentProfile();
  const updateProfile = useUpdateTalentProfile();
  const updatePhoto = useUpdateTalentPhoto();
  const deletePhoto = useDeleteTalentPhoto();

  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [bio, setBio] = useState("");
  const [knowledgeAreas, setKnowledgeAreas] = useState<string[]>([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isPhotoMarkedForDeletion, setIsPhotoMarkedForDeletion] =
    useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setLastname(profile.lastname ?? "");
    setFieldOfStudy(profile.field_of_study ?? "");
    setBio(profile.bio ?? "");
    setKnowledgeAreas(profile.knowledge_areas ?? []);
    setGithubUrl(profile.github_url ?? "");
    setLinkedinUrl(profile.linkedin_url ?? "");
    setTwitterUrl(profile.twitter_url ?? "");
    setInstagramUrl(profile.instagram_url ?? "");
    setPhotoPreview(resolveIpfs(profile.photo_url));
  }, [profile]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return previewUrl;
    });
    setIsPhotoMarkedForDeletion(false);
    setIsCompressing(true);

    try {
      const compressed = await compressImage(file);
      const ipfsUrl = await updatePhoto.mutateAsync(compressed);
      setPhotoPreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return resolveIpfs(ipfsUrl);
      });
      toast({
        title: t("editProfile.photoUploadedTitle", "Foto actualizada"),
        description: "",
        variant: "success",
      });
    } catch (err: unknown) {
      setPhotoPreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return resolveIpfs(profile?.photo_url ?? null);
      });
      const message =
        err instanceof Error ? err.message : "No se pudo subir la foto";
      toast({
        title: t("editProfile.errorTitle"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDeletePhotoIntent = async () => {
    try {
      await deletePhoto.mutateAsync();
      setPhotoPreview(null);
      setIsPhotoMarkedForDeletion(false);
      toast({
        title: t("editProfile.photoDeletedTitle", "Foto eliminada"),
        description: "",
        variant: "success",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "No se pudo eliminar la foto";
      toast({
        title: t("editProfile.errorTitle"),
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleSaveIntent = () => {
    if (
      updateProfile.isPending ||
      updatePhoto.isPending ||
      deletePhoto.isPending
    )
      return;
    if (
      !isValidUrl(githubUrl) ||
      !isValidUrl(linkedinUrl) ||
      !isValidUrl(twitterUrl) ||
      !isValidUrl(instagramUrl)
    ) {
      toast({
        title: t("editProfile.errorTitle"),
        description: t("editProfile.invalidUrl"),
        variant: "destructive",
      });
      return;
    }
    const displayName = [name, lastname].filter(Boolean).join(" ");
    const missing = missingSections(
      displayName,
      bio,
      knowledgeAreas,
      photoPreview,
      t,
    );
    if (missing.length > 0) {
      setShowIncompleteDialog(true);
    } else {
      void handleSave();
    }
  };

  const handleSave = async () => {
    setShowIncompleteDialog(false);
    if (updateProfile.isPending) return;

    try {
      if (isPhotoMarkedForDeletion) {
        await deletePhoto.mutateAsync();
        setIsPhotoMarkedForDeletion(false);
      }

      await updateProfile.mutateAsync({
        bio: bio.trim() || null,
        field_of_study: fieldOfStudy.trim() || null,
        knowledge_areas: knowledgeAreas,
        github_url: githubUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
      });

      toast({
        title: t("editProfile.savedTitle", "Perfil guardado"),
        description: t("editProfile.savedDesc"),
        variant: "success",
      });

      if (!profile?.email_verified) {
        navigate("/verify-email");
      } else {
        navigate("/dashboard/talent");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Algo salió mal";
      toast({
        title: t("editProfile.errorTitle"),
        description: message,
        variant: "destructive",
      });
    }
  };

  const isSaving =
    updateProfile.isPending || updatePhoto.isPending || deletePhoto.isPending;
  const displayName = [name, lastname].filter(Boolean).join(" ");
  const completion = profileCompletion(
    displayName,
    bio,
    knowledgeAreas,
    photoPreview,
  );
  const wallet = profile?.walletAddress ?? "";

  if (isLoadingProfile) {
    return (
      <Layout>
        <GrainOverlay />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2
            className="h-7 w-7 animate-spin"
            style={{ color: P.accent }}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <GrainOverlay />
      <div className="min-h-screen font-body" style={{ color: P.textPrimary }}>
        {/* ── Sticky top bar ── */}
        <div
          className="sticky top-0 z-20 backdrop-blur-xl"
          style={{
            backgroundColor: "oklch(0.11 0.012 280 / 0.78)",
            borderBottom: `1px solid ${P.borderSub}`,
          }}
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <button
              onClick={() => navigate("/dashboard/talent")}
              className="flex items-center gap-2 transition-colors text-sm rounded-full px-2 py-1.5 -ml-2"
              style={{ color: P.textMuted }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = P.textPrimary)
              }
              onMouseLeave={(e) => (e.currentTarget.style.color = P.textMuted)}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("editProfile.backToDashboard", "Volver")}
              </span>
            </button>

            {/* compact completion meter */}
            <div className="flex items-center gap-2.5">
              <div
                className="hidden sm:block w-24 h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: P.surface }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: P.accent }}
                  initial={{ width: 0 }}
                  animate={{ width: `${completion}%` }}
                  transition={{
                    duration: prefersReduced ? 0 : 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              </div>
              <span
                className="text-[11px] font-mono tabular-nums"
                style={{ color: completion === 100 ? P.emerald : P.textMuted }}
              >
                {completion}%
              </span>
            </div>
          </div>
        </div>

        <motion.main
          initial={prefersReduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReduced ? 0 : 0.4,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-32 space-y-5"
        >
          {/* ── Hero identity card ── */}
          <section
            className="rounded-2xl px-6 sm:px-7 py-7"
            style={{ backgroundColor: P.card, border: `1px solid ${P.border}` }}
          >
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden"
                  style={{
                    border: `1px solid ${P.border}`,
                    backgroundColor: P.surface,
                  }}
                >
                  <Avatar className="h-full w-full rounded-2xl">
                    <AvatarImage
                      src={photoPreview ?? undefined}
                      alt={displayName}
                      className="object-cover"
                    />

                    <AvatarFallback
                      className="relative h-full w-full rounded-none flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: P.surface,
                      }}
                    >
                      {/* Glow */}
                      <span
                        className="absolute h-16 w-16 rounded-full blur-2xl opacity-50"
                        style={{
                          backgroundColor: P.accent,
                        }}
                      />

                      {/* Iniciales */}
                      <span
                        className="relative z-10 text-2xl font-bold"
                        style={{
                          color: P.textPrimary,
                        }}
                      >
                        {initials(name, lastname) || "?"}
                      </span>
                    </AvatarFallback>
                  </Avatar>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      disabled={isSaving}
                      aria-label={t("editProfile.uploadNewPhoto")}
                      className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                      style={{
                        backgroundColor: P.accent,
                        border: `2px solid ${P.card}`,
                      }}
                    >
                      <Camera className="h-3.5 w-3.5" style={{ color: P.bg }} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44 z-50">
                    <DropdownMenuItem
                      onClick={() => profilePhotoInputRef.current?.click()}
                      className="cursor-pointer"
                    >
                      {t("editProfile.uploadNewPhoto")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDeletePhotoIntent}
                      disabled={!photoPreview}
                      className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                    >
                      {t("editProfile.removePhoto")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <input
                  ref={profilePhotoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                  disabled={isSaving}
                />
              </div>

              {/* Name + fields */}
              <div className="flex-1 min-w-0 sm:pb-1 space-y-3">
                <div className="flex items-center gap-0.5">
                  {/* Nombre */}
                  <h1
                    className="text-[1.55rem] sm:text-[1.75rem] font-bold leading-tight"
                    style={{ color: P.textPrimary }}
                  >
                    {displayName}
                  </h1>
                </div>
                {wallet && (
                  <div className="pt-1 flex items-center gap-2">
                    <span
                      className="text-xs font-mono"
                      style={{ color: P.textMuted }}
                    >
                      {wallet.slice(0, 6)}…{wallet.slice(-4)}
                    </span>
                    <button
                      onClick={() => navigate(`/talent/${wallet}`)}
                      className="flex items-center gap-1 text-xs transition-colors"
                      style={{ color: P.textMuted }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = P.accent)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = P.textMuted)
                      }
                    >
                      <ExternalLink className="h-3 w-3" />
                      {t("editProfile.viewPublicProfile")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Field of study ── */}
          <SectionCard label={t("editProfile.fieldOfStudyLabel")}>
            <input
              type="text"
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              disabled={isSaving}
              maxLength={100}
              placeholder={t("editProfile.fieldOfStudyPlaceholder")}
              className="w-full bg-transparent border-0 outline-none py-2 text-[15px] disabled:opacity-60"
              style={{ color: P.textPrimary }}
            />
          </SectionCard>

          {/* ── Bio ── */}
          <SectionCard
            label={t("editProfile.bioSection")}
            trailing={
              <span
                className="text-xs font-mono tabular-nums shrink-0 mt-1"
                style={{ color: bio.length > 450 ? P.amber : P.textMuted }}
              >
                {bio.length}/500
              </span>
            }
          >
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={isSaving}
              maxLength={500}
              rows={5}
              placeholder={t("editProfile.bioPlaceholderTalent")}
              className="w-full rounded-xl outline-none resize-none text-[15px] leading-relaxed p-4 shadow-none ring-0 focus-visible:ring-0 transition-colors"
              style={{
                backgroundColor: P.surface,
                border: `1px solid ${P.border}`,
                color: P.textPrimary,
              }}
            />
          </SectionCard>

          {/* ── Knowledge areas ── */}
          <SectionCard label={t("editProfile.areasSection")}>
            <KnowledgeAreasSelector
              selected={knowledgeAreas}
              onChange={setKnowledgeAreas}
              disabled={isSaving}
            />
          </SectionCard>

          {/* ── Social links ── */}
          <SectionCard label={t("editProfile.linksSection")}>
            <div className="space-y-4">
              <SocialInput
                icon={<Github className="h-4 w-4" />}
                label={t("editProfile.githubLabel")}
                placeholder={t(
                  "editProfile.githubPlaceholder",
                  "https://github.com/username",
                )}
                value={githubUrl}
                onChange={setGithubUrl}
                disabled={isSaving}
              />
              <SocialInput
                icon={<Linkedin className="h-4 w-4" />}
                label={t("editProfile.linkedinLabel")}
                placeholder={t(
                  "editProfile.linkedinPlaceholder",
                  "https://linkedin.com/in/username",
                )}
                value={linkedinUrl}
                onChange={setLinkedinUrl}
                disabled={isSaving}
              />
              <SocialInput
                icon={<Twitter className="h-4 w-4" />}
                label={t("editProfile.twitterLabel")}
                placeholder={t(
                  "editProfile.twitterPlaceholder",
                  "https://twitter.com/username",
                )}
                value={twitterUrl}
                onChange={setTwitterUrl}
                disabled={isSaving}
              />
              <SocialInput
                icon={<Instagram className="h-4 w-4" />}
                label={t("editProfile.instagramLabel")}
                placeholder={t(
                  "editProfile.instagramPlaceholder",
                  "https://instagram.com/username",
                )}
                value={instagramUrl}
                onChange={setInstagramUrl}
                disabled={isSaving}
              />
            </div>
          </SectionCard>

          {/* ── Account info ── */}
          <SectionCard label={t("editProfile.accountSection")}>
            <div className="space-y-3">
              <div
                className="flex items-center justify-between py-3"
                style={{ borderBottom: `1px solid ${P.borderSub}` }}
              >
                <span
                  className="text-[11px] uppercase tracking-[0.16em] font-semibold"
                  style={{ color: P.textMuted }}
                >
                  {t("editProfile.roleLabel")}
                </span>
                <span
                  className="text-sm font-mono"
                  style={{ color: P.textSecondary }}
                >
                  {t("editProfile.talentRole")}
                </span>
              </div>
              <div
                className="flex items-center justify-between py-3"
                style={{ borderBottom: `1px solid ${P.borderSub}` }}
              >
                <span
                  className="text-[11px] uppercase tracking-[0.16em] font-semibold"
                  style={{ color: P.textMuted }}
                >
                  {t("editProfile.walletLabel")}
                </span>
                <span
                  className="text-sm font-mono"
                  style={{ color: P.textSecondary }}
                >
                  {wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span
                  className="text-[11px] uppercase tracking-[0.16em] font-semibold"
                  style={{ color: P.textMuted }}
                >
                  {t("editProfile.emailLabel")}
                </span>
                <span
                  className="text-sm font-mono"
                  style={{ color: P.textSecondary }}
                >
                  {(() => {
                    if (!profile?.email) return "—";
                    const [name, domain] = profile.email.split("@");
                    return name && domain
                      ? `${name.slice(0, 2)}***@${domain}`
                      : profile.email;
                  })()}
                </span>
              </div>
            </div>
          </SectionCard>
        </motion.main>

        {/* ── Incomplete profile dialog ── */}
        <AlertDialog
          open={showIncompleteDialog}
          onOpenChange={setShowIncompleteDialog}
        >
          <AlertDialogContent
            className="max-w-md backdrop-blur-xl"
            style={{ backgroundColor: P.card, border: `1px solid ${P.border}` }}
          >
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: P.amberSoft }}
                >
                  <X className="h-4 w-4" style={{ color: P.amber }} />
                </div>
                <AlertDialogTitle
                  className="font-bold tracking-tight"
                  style={{ color: P.textPrimary }}
                >
                  {t("editProfile.missingDialogTitle")}
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription asChild>
                <div
                  className="space-y-3 text-sm"
                  style={{ color: P.textSecondary }}
                >
                  <p>{t("editProfile.missingDialogDesc")}</p>
                  <ul className="space-y-2">
                    {missingSections(
                      displayName,
                      bio,
                      knowledgeAreas,
                      photoPreview,
                      t,
                    ).map((item) => {
                      const [title, desc] = item.split(" — ");
                      return (
                        <li
                          key={title}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl"
                          style={{
                            backgroundColor: P.amberSoft,
                            border: `1px solid oklch(0.78 0.14 75 / 0.20)`,
                          }}
                        >
                          <span
                            className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: P.amber }}
                          />
                          <span>
                            <span
                              className="font-medium"
                              style={{ color: P.textPrimary }}
                            >
                              {title}
                            </span>
                            {desc && (
                              <span style={{ color: P.textMuted }}>
                                {" "}
                                — {desc}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-xs pt-1" style={{ color: P.textMuted }}>
                    {t("editProfile.completeProfileHint")}
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 mt-2">
              <AlertDialogCancel
                className="bg-transparent"
                style={{
                  border: `1px solid ${P.border}`,
                  color: P.textSecondary,
                }}
              >
                {t("editProfile.keepEditing")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSave}
                style={{
                  backgroundColor: P.accent,
                  color: P.bg,
                  border: "none",
                }}
              >
                {t("editProfile.saveAnyway")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Footer ── */}
        <footer
          className="sticky bottom-0 z-10 backdrop-blur-xl"
          style={{
            backgroundColor: "oklch(0.11 0.012 280 / 0.85)",
            borderTop: `1px solid ${P.borderSub}`,
          }}
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <p
              className="text-xs hidden sm:block"
              style={{ color: P.textMuted }}
            >
              {t("editProfile.savedChangesNote")}
            </p>
            <Button
              onClick={handleSaveIntent}
              disabled={isSaving}
              className="ml-auto font-semibold px-7 rounded-full transition-all hover:scale-[1.015] disabled:hover:scale-100"
              style={{ backgroundColor: P.accent, color: P.bg, border: "none" }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  {t("editProfile.saving")}
                </>
              ) : (
                t("editProfile.saveBtn")
              )}
            </Button>
          </div>
        </footer>
      </div>
    </Layout>
  );
};

export default EditTalentProfile;

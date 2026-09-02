import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Linkedin,
  Twitter,
  Instagram,
  Github,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import Layout from "@/components/Layout";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ShareButton } from "@/components/ShareButton";
import { useTranslation } from "react-i18next";
import { P } from "@/components/profile/palette";
import { GrainOverlay } from "@/components/profile/GrainOverlay";
import { resolveIpfs } from "@/lib/ipfs";
import { api } from "@/services/api";
import {
  useTalentProfile,
  type PublicTalentProfile,
} from "@/hooks/useTalentProfile";
import {
  useMyTalentProfile,
  type MyTalentProfile,
} from "@/hooks/useMyTalentProfile";

const easeOutExpo = [0.16, 1, 0.3, 1] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TalentProfileView {
  isOwnProfile: boolean;
  name: string;
  fieldOfStudy: string | null;
  photoUrl: string | null;
  bio: string | null;
  knowledgeAreas: string[];
  totalCertificates: number | null;
  walletAddress: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name: string | null, lastname: string | null): string {
  const source = [name, lastname].filter(Boolean).join(" ");

  return source
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function explorerUrl(address: string): string {
  const chainId = import.meta.env.VITE_CHAIN_ID;

  if (chainId === "80002") {
    return `https://amoy.polygonscan.com/address/${address}`;
  }

  return `https://polygonscan.com/address/${address}`;
}

function mapOwnTalentToView(talent: MyTalentProfile): TalentProfileView {
  return {
    isOwnProfile: true,
    name:
      [talent.name, talent.lastname].filter(Boolean).join(" ") ||
      talent.field_of_study ||
      "Talento",
    fieldOfStudy: talent.field_of_study,
    photoUrl: talent.photo_url,
    bio: talent.bio,
    knowledgeAreas: talent.knowledge_areas ?? [],
    totalCertificates: null,
    walletAddress: talent.walletAddress,
    githubUrl: talent.github_url,
    linkedinUrl: talent.linkedin_url,
    twitterUrl: talent.twitter_url,
    instagramUrl: talent.instagram_url,
  };
}

function mapPublicTalentToView(
  talent: PublicTalentProfile,
): TalentProfileView {
  return {
    isOwnProfile: false,
    name: "Talento",
    fieldOfStudy: talent.field_of_study,
    photoUrl: talent.photo_url,
    bio: null,
    knowledgeAreas: [],
    totalCertificates: talent.total_certificates,
    walletAddress: null,
    githubUrl: null,
    linkedinUrl: null,
    twitterUrl: null,
    instagramUrl: null,
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function Pulse({
  w,
  h,
  radius = 8,
}: {
  w: number | string;
  h: number;
  radius?: number;
}) {
  return (
    <div
      className="animate-pulse shrink-0"
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        backgroundColor: P.surface,
      }}
    />
  );
}

function ProfileSkeleton() {
  return (
    <div
      className="space-y-5"
      aria-label="Cargando perfil..."
      aria-busy="true"
    >
      <div
        className="rounded-2xl p-6 sm:p-7 space-y-5"
        style={{
          backgroundColor: P.card,
          border: `1px solid ${P.border}`,
        }}
      >
        <div className="flex flex-col sm:flex-row gap-5">
          <Pulse w={84} h={84} radius={16} />

          <div className="flex-1 space-y-3 pt-1">
            <Pulse w={200} h={24} />
            <Pulse w={130} h={15} />

            <div className="flex flex-wrap gap-2 mt-1">
              <Pulse w={128} h={34} />
              <Pulse w={148} h={34} />
            </div>

            <Pulse w="100%" h={13} />
            <Pulse w="80%" h={13} />
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: P.card,
          border: `1px solid ${P.border}`,
        }}
      >
        <div className="flex gap-10">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Pulse w={56} h={36} />
              <Pulse w={120} h={11} radius={4} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section card
// ---------------------------------------------------------------------------

interface SectionProps {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function Section({ label, icon, children }: SectionProps) {
  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: P.card,
        border: `1px solid ${P.border}`,
      }}
    >
      <header
        className="flex items-center gap-2.5 px-6 py-4"
        style={{ borderBottom: `1px solid ${P.borderSub}` }}
      >
        {icon && (
          <span style={{ color: P.textMuted }}>
            {icon}
          </span>
        )}

        <h2
          className="text-[11px] uppercase tracking-[0.18em] font-semibold"
          style={{ color: P.textMuted }}
        >
          {label}
        </h2>
      </header>

      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Wallet chip
// ---------------------------------------------------------------------------

function WalletChip({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 rounded-md text-[11px] font-mono tracking-wide cursor-pointer select-none"
      style={{
        backgroundColor: P.surface,
        border: `1px solid ${copied ? P.accentBorder : P.border}`,
        color: copied ? P.accent : P.textSecondary,
        height: 34,
        transition: "border-color 0.15s ease, color 0.15s ease",
      }}
      aria-label={`Wallet: ${address}. Click to copy`}
    >
      {copied ? (
        <BadgeCheck
          size={11}
          style={{ color: P.accent }}
          aria-hidden
        />
      ) : (
        <img
          src="/icons/wallet.avif"
          className="h-3.5 w-3.5 shrink-0 object-contain"
          style={{ opacity: 0.55 }}
          aria-hidden
        />
      )}

      {shortAddress(address)}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Knowledge area chip
// ---------------------------------------------------------------------------

function KnowledgeChip({ label }: { label: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <span
      className="inline-flex items-center px-3.5 py-2 rounded-full text-sm font-medium select-none cursor-default"
      style={{
        backgroundColor: hovered ? P.accentSoft : P.surface,
        border: `1px solid ${
          hovered ? P.accentBorder : P.border
        }`,
        color: hovered ? P.accent : P.textSecondary,
        transition:
          "background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease",
        minHeight: 36,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Social link row
// ---------------------------------------------------------------------------

function SocialLink({
  icon,
  label,
  url,
}: {
  icon: React.ReactNode;
  label: string;
  url: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="group flex items-center gap-3.5 rounded-xl px-4 py-3 transition-colors"
      style={{
        backgroundColor: P.surface,
        border: `1px solid ${P.border}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = P.accentBorder;
        e.currentTarget.style.backgroundColor = P.surfaceHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = P.border;
        e.currentTarget.style.backgroundColor = P.surface;
      }}
    >
      <span
        className="flex items-center justify-center h-9 w-9 rounded-lg shrink-0"
        style={{
          backgroundColor: P.cardSoft,
          color: P.accent,
        }}
      >
        {icon}
      </span>

      <div className="flex-1 min-w-0">
        <div
          className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-0.5"
          style={{ color: P.textMuted }}
        >
          {label}
        </div>

        <div
          className="text-sm truncate"
          style={{ color: P.textSecondary }}
        >
          {url.replace(/^https?:\/\//, "")}
        </div>
      </div>

      <ExternalLink
        className="h-4 w-4 shrink-0 transition-colors"
        style={{ color: P.textMuted }}
      />
    </a>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const TalentProfile = () => {
  const { wallet } = useParams<{ wallet: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();

  const normalizedWallet = wallet?.toLowerCase();

  const isOwnProfile =
    user?.role === "student" &&
    !!user.walletAddress &&
    user.walletAddress.toLowerCase() === normalizedWallet;

  const {
    data: ownTalent,
    isPending: isOwnPending,
    isError: isOwnError,
  } = useMyTalentProfile(isOwnProfile);

  const {
    data: publicTalent,
    isPending: isPublicPending,
    isError: isPublicError,
  } = useTalentProfile(normalizedWallet, !isOwnProfile);

  const profile: TalentProfileView | null = isOwnProfile
    ? ownTalent
      ? mapOwnTalentToView(ownTalent)
      : null
    : publicTalent
      ? mapPublicTalentToView(publicTalent)
      : null;

  const isLoading = isOwnProfile
    ? isOwnPending
    : isPublicPending;

  const isError = isOwnProfile
    ? isOwnError
    : isPublicError;

  const hasKnowledgeAreas =
    profile?.knowledgeAreas.length
      ? profile.knowledgeAreas.length > 0
      : false;

  const hasAnyLinks =
    profile !== null &&
    !!(
      profile.githubUrl ||
      profile.linkedinUrl ||
      profile.twitterUrl ||
      profile.instagramUrl
    );
  const dur = (ms: number) =>
    ({ duration: prefersReduced ? 0 : ms / 1000, ease: easeOutExpo }) as const;
  const profileUrl = `${window.location.origin}/talent/${normalizedWallet}`;
  const itemVariants = {
    hidden: { opacity: prefersReduced ? 1 : 0, y: prefersReduced ? 0 : 8 },
    visible: { opacity: 1, y: 0, transition: dur(280) },
  };

  if (!wallet || isError) {
    return (
      <Layout>
        <GrainOverlay />

        <div className="min-h-screen font-body text-slate-200 px-4 sm:px-6 md:px-10 pt-8 pb-28 max-w-2xl mx-auto">
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <p
              className="text-sm"
              style={{ color: P.textMuted }}
            >
              {t("talentProfile.talentNotFound")}
            </p>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mt-1"
              style={{ color: P.textSecondary }}
            >
              {t("backBtn")}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <GrainOverlay />

      <div
        className="min-h-screen font-body"
        style={{ color: P.textPrimary }}
      >
        <motion.main
          initial={
            prefersReduced
              ? false
              : { opacity: 0, y: -8 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReduced ? 0 : 0.38,
            ease: easeOutExpo,
          }}
          className="relative px-4 sm:px-6 md:px-10 pt-8 pb-28 max-w-2xl mx-auto"
        >
          {/* ── Header ── */}
          <header className="mb-8 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 rounded-full px-3 -ml-2"
              style={{
                color: P.textSecondary,
                minHeight: 44,
              }}
            >
              <ArrowLeft
                className="h-4 w-4 shrink-0"
                aria-hidden
              />

              <span className="hidden sm:inline text-sm">
                {t("backBtn", "Volver")}
              </span>
            </Button>
          </header>

          {/* ── Loading ── */}
          {isLoading && <ProfileSkeleton />}

          {/* ── Populated ── */}
          {profile && !isLoading && (
            <motion.div
              initial="hidden"
              animate="visible"
              className="space-y-8"
              variants={{
                hidden: {},
                visible: {
                  transition: prefersReduced
                    ? {}
                    : { staggerChildren: 0.06 },
                },
              }}
            >
              {/* ── Hero ── */}
              <motion.div variants={itemVariants}>
                <article
                  className="relative overflow-hidden rounded-2xl"
                  style={{
                    backgroundColor: P.card,
                    border: `1px solid ${P.border}`,
                  }}
                >
                  <div
                    aria-hidden
                    className="relative h-24 sm:h-28"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.18 0.030 280) 0%, oklch(0.14 0.020 280) 60%, oklch(0.16 0.040 285) 100%)",
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "radial-gradient(ellipse at 80% 0%, oklch(0.70 0.16 280 / 0.18) 0%, transparent 55%)",
                      }}
                    />
                  </div>

                  {/* Identity block */}
                  <div className="relative px-6 sm:px-7 pb-6 sm:pb-7 -mt-10 sm:-mt-12">
                    <div className="flex flex-col sm:flex-row gap-5 sm:items-end">
                      <Avatar
                        className="shrink-0 rounded-2xl"
                        style={{
                          width: 88,
                          height: 88,
                          border: `3px solid ${P.card}`,
                          backgroundColor: P.surface,
                        }}
                      >
                        {profile.photoUrl ? (
                          <AvatarImage
                            src={resolveIpfs(profile.photoUrl)}
                            alt={profile.name}
                            className="rounded-2xl object-cover"
                            width={88}
                            height={88}
                          />
                        ) : (
                          <AvatarFallback
                            className="relative h-full w-full rounded-none flex items-center justify-center overflow-hidden"
                            style={{
                              backgroundColor: P.surface,
                            }}
                          >
                            <span
                              className="absolute h-16 w-16 rounded-full blur-2xl opacity-50"
                              style={{
                                backgroundColor: P.accent,
                              }}
                            />

                            <span
                              className="relative z-10 text-2xl font-bold"
                              style={{
                                color: P.textPrimary,
                              }}
                            >
                              {profile.isOwnProfile
                                ? initials(
                                    ownTalent?.name ?? null,
                                    ownTalent?.lastname ?? null,
                                  ) || "?"
                                : "?"}
                            </span>
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="flex-1 min-w-0 sm:pb-1">
                        <div
                          className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-2"
                          style={{ color: P.accent }}
                        >
                          {t("talentProfile.talentRoleLabel")}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <h1
                            className="text-[1.55rem] sm:text-[1.75rem] font-bold leading-tight"
                            style={{ color: P.textPrimary }}
                          >
                            {profile.name}
                          </h1>

                          {profile.fieldOfStudy && (
                            <BadgeCheck
                              className="h-6 w-6 shrink-0"
                              style={{ color: "#a855f7" }}
                              title={t(
                                "talentProfile.expertBadge",
                                "Verificado",
                              )}
                              aria-label={t(
                                "talentProfile.expertBadge",
                                "Verificado",
                              )}
                            />
                          )}
                        </div>

                        {profile.fieldOfStudy && (
                          <p
                            className="text-sm font-medium mt-1"
                            style={{
                              color: P.textSecondary,
                            }}
                          >
                            {profile.fieldOfStudy}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Meta actions */}
                    <div className="flex flex-wrap items-center gap-2 mt-5">
                      {profile.walletAddress && (
                        <WalletChip
                          address={profile.walletAddress}
                        />
                      )}

                      {normalizedWallet && (
                        <ShareButton
                          url={profileUrl}
                          displayName={profile.name}
                          shareText={t(
                            `Check out ${profile.name}'s profile on HackChain`,
                          )}
                          qrCaption={t("share.scanProfile", {
                            name: profile.name,
                          })}
                          variant="outline"
                          onShare={() =>
                            api.registerProfileStudentsShare(
                              normalizedWallet,
                            )
                          }
                        />
                      )}
                    </div>
                  </div>
                </article>
              </motion.div>

              {/* ── Public statistics ── */}
              {profile.totalCertificates !== null && (
                <motion.div variants={itemVariants}>
                  <div
                    className="rounded-2xl px-6 py-6 flex flex-col items-center justify-center"
                    style={{
                      backgroundColor: P.card,
                      border: `1px solid ${P.border}`,
                    }}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <span
                        className="flex items-center justify-center h-11 w-11 rounded-xl shrink-0"
                        style={{
                          backgroundColor: P.accentSoft,
                        }}
                      >
                        <img
                          src="/icons/medalla.avif"
                          className="h-6 w-6 object-contain"
                          alt=""
                          aria-hidden
                        />
                      </span>

                      <span
                        className="text-3xl font-bold leading-none tabular-nums"
                        style={{ color: P.textPrimary }}
                      >
                        {profile.totalCertificates}
                      </span>
                    </div>

                    <div
                      className="text-[10px] uppercase tracking-[0.18em] font-semibold mt-3 text-center"
                      style={{ color: P.textMuted }}
                    >
                      {t(
                        "talentProfile.certificatesEarnedLabel",
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Private profile sections ── */}
              {profile.isOwnProfile && (
                <>
                  {/* ── About ── */}
                  <motion.div variants={itemVariants}>
                    <Section
                      label={t(
                        "talentProfile.aboutYouSection",
                      )}
                    >
                      {profile.bio ? (
                        <p
                          className="text-[15px] leading-relaxed whitespace-pre-line"
                          style={{
                            color: P.textBio,
                            maxWidth: "60ch",
                          }}
                        >
                          {profile.bio}
                        </p>
                      ) : (
                        <p
                          className="text-sm italic"
                          style={{ color: P.textMuted }}
                        >
                          {t("talentProfile.noBio")}
                        </p>
                      )}
                    </Section>
                  </motion.div>

                  {/* ── Knowledge areas ── */}
                  {hasKnowledgeAreas && (
                    <motion.div variants={itemVariants}>
                      <Section
                        label={t(
                          "talentProfile.expertBadge",
                        )}
                      >
                        <div
                          className="flex flex-wrap gap-2"
                          role="list"
                        >
                          {profile.knowledgeAreas.map(
                            (area) => (
                              <span
                                key={area}
                                role="listitem"
                              >
                                <KnowledgeChip label={area} />
                              </span>
                            ),
                          )}
                        </div>
                      </Section>
                    </motion.div>
                  )}

                  {/* ── Social links ── */}
                  {hasAnyLinks && (
                    <motion.div variants={itemVariants}>
                      <Section
                        label={t(
                          "talentProfile.linksSection",
                        )}
                      >
                        <div className="space-y-2.5">
                          {profile.githubUrl && (
                            <SocialLink
                              icon={
                                <Github className="h-4 w-4" />
                              }
                              label={t(
                                "talentProfile.gitLabel",
                              )}
                              url={profile.githubUrl}
                            />
                          )}

                          {profile.linkedinUrl && (
                            <SocialLink
                              icon={
                                <Linkedin className="h-4 w-4" />
                              }
                              label={t(
                                "talentProfile.linkedinLabel",
                              )}
                              url={profile.linkedinUrl}
                            />
                          )}

                          {profile.twitterUrl && (
                            <SocialLink
                              icon={
                                <Twitter className="h-4 w-4" />
                              }
                              label={t(
                                "talentProfile.twitterLabel",
                              )}
                              url={profile.twitterUrl}
                            />
                          )}

                          {profile.instagramUrl && (
                            <SocialLink
                              icon={
                                <Instagram className="h-4 w-4" />
                              }
                              label={t(
                                "talentProfile.instagramLabel",
                              )}
                              url={profile.instagramUrl}
                            />
                          )}
                        </div>
                      </Section>
                    </motion.div>
                  )}

                  {/* ── Verification ── */}
                  {profile.walletAddress && (
                    <motion.div variants={itemVariants}>
                      <Section
                        label={t(
                          "talentProfile.verificationSection",
                        )}
                        icon={
                          <ShieldCheck className="h-3.5 w-3.5" />
                        }
                      >
                        <div className="space-y-3">
                          <div
                            className="flex flex-col gap-3 rounded-xl px-4 py-3 sm:flex-row sm:items-center justify-between"
                            style={{
                              backgroundColor: P.surface,
                              border: `1px solid ${P.border}`,
                            }}
                          >
                            <div className="min-w-0">
                              <div
                                className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-1"
                                style={{
                                  color: P.textMuted,
                                }}
                              >
                                {t(
                                  "talentProfile.issuerWalletLabel",
                                )}
                              </div>

                              <div
                                className="text-sm font-mono break-all"
                                style={{
                                  color: P.textSecondary,
                                }}
                              >
                                {profile.walletAddress}
                              </div>
                            </div>

                            <a
                              href={explorerUrl(
                                profile.walletAddress,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shrink-0 transition-colors"
                              style={{
                                backgroundColor: P.accentSoft,
                                color: P.accent,
                                border: `1px solid ${P.accentBorder}`,
                              }}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />

                              <span className="hidden sm:inline">
                                {t(
                                  "talentProfile.viewOnExplorer",
                                )}
                              </span>
                            </a>
                          </div>
                        </div>
                      </Section>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </motion.main>
      </div>
    </Layout>
  );
};

export default TalentProfile;

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Check, Globe, Linkedin, Twitter, ExternalLink, ShieldCheck } from 'lucide-react';
import Layout from '@/components/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useEducatorProfile } from '@/hooks/useEducatorProfile';
import { useTranslation } from 'react-i18next';
import { P } from '@/components/profile/palette';
import { GrainOverlay } from '@/components/profile/GrainOverlay';
import { resolveIpfs } from '@/lib/ipfs';

const HackChainLogo = '/images/logoHackchain2.webp';

const easeOutExpo = [0.16, 1, 0.3, 1] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

function initials(name: string | null, lastname: string | null, org: string): string {
  const source = [name, lastname].filter(Boolean).join(' ') || org;
  return source.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function explorerUrl(address: string): string {
  const chainId = import.meta.env.VITE_CHAIN_ID;
  // 80002 = Polygon Amoy testnet, anything else defaults to mainnet polygonscan
  if (chainId === '80002') return `https://amoy.polygonscan.com/address/${address}`;
  return `https://polygonscan.com/address/${address}`;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function Pulse({ w, h, radius = 8 }: { w: number | string; h: number; radius?: number }) {
  return (
    <div
      className="animate-pulse shrink-0"
      style={{ width: w, height: h, borderRadius: radius, backgroundColor: P.surface }}
    />
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-5" aria-label="Cargando perfil..." aria-busy="true">
      <div
        className="rounded-2xl p-6 sm:p-7 space-y-5"
        style={{ backgroundColor: P.card, border: `1px solid ${P.border}` }}
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
        style={{ backgroundColor: P.card, border: `1px solid ${P.border}` }}
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
// Section card — uniform container
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
      style={{ backgroundColor: P.card, border: `1px solid ${P.border}` }}
    >
      <header
        className="flex items-center gap-2.5 px-6 py-4"
        style={{ borderBottom: `1px solid ${P.borderSub}` }}
      >
        {icon && <span style={{ color: P.textMuted }}>{icon}</span>}
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
// Wallet chip — copyable
// ---------------------------------------------------------------------------

function WalletChip({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
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
        transition: 'border-color 0.15s ease, color 0.15s ease',
      }}
      aria-label={`Wallet: ${address}. Click to copy`}
    >
      {copied ? (
        <Check size={11} style={{ color: P.accent }} aria-hidden />
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
        border: `1px solid ${hovered ? P.accentBorder : P.border}`,
        color: hovered ? P.accent : P.textSecondary,
        transition: 'background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease',
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
// Social link row — only renders when value exists
// ---------------------------------------------------------------------------

function SocialLink({ icon, label, url }: { icon: React.ReactNode; label: string; url: string }) {
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
        style={{ backgroundColor: P.cardSoft, color: P.accent }}
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
        <div className="text-sm truncate" style={{ color: P.textSecondary }}>
          {url.replace(/^https?:\/\//, '')}
        </div>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 transition-colors" style={{ color: P.textMuted }} />
    </a>
  );
}

// ---------------------------------------------------------------------------
// Empty placeholder for sections without data yet
// ---------------------------------------------------------------------------

function ComingSoon({ imgSrc, label, hint }: { imgSrc: string; label: string; hint: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-10 px-6 rounded-xl text-center"
      style={{ backgroundColor: P.cardSoft, border: `1px dashed ${P.border}` }}
    >
      <img src={imgSrc} className="h-10 w-10 object-contain mb-3" alt="" aria-hidden style={{ opacity: 0.55 }} />
      <p
        className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-1.5"
        style={{ color: P.textMuted }}
      >
        {label}
      </p>
      <p className="text-sm max-w-xs" style={{ color: P.textMuted }}>
        {hint}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const EducatorProfile = () => {
  const { wallet } = useParams<{ wallet: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const { data: educator, isPending, isError } = useEducatorProfile(wallet);

  const displayName =
    [educator?.name, educator?.lastname].filter(Boolean).join(' ') ||
    educator?.organization_name ||
    '—';

  const dur = (ms: number) =>
    ({ duration: prefersReduced ? 0 : ms / 1000, ease: easeOutExpo }) as const;

  const containerVariants = {
    hidden: {},
    visible: { transition: prefersReduced ? {} : { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: prefersReduced ? 1 : 0, y: prefersReduced ? 0 : 8 },
    visible: { opacity: 1, y: 0, transition: dur(280) },
  };

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined;
  const hasAnyLinks =
    !!educator?.website_url || !!educator?.linkedin_url || !!educator?.twitter_url;

  return (
    <Layout>
      <GrainOverlay />

      <div className="min-h-screen font-body" style={{ color: P.textPrimary }}>
        <motion.main
          initial={prefersReduced ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={dur(380)}
          className="relative px-4 sm:px-6 md:px-10 pt-8 pb-28 max-w-2xl mx-auto"
        >
          {/* ── Header ── */}
          <header className="mb-8 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 rounded-full px-3 -ml-2"
              style={{ color: P.textMuted, minHeight: 44 }}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline text-sm">{t('backBtn')}</span>
            </Button>

            <img
              src={HackChainLogo}
              alt="HackChain"
              className="h-8 object-contain"
              style={{ opacity: 0.7 }}
            />
          </header>

          {/* ── Error state ── */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <img
                src="/icons/graduado.avif"
                className="h-10 w-10 object-contain"
                style={{ opacity: 0.15 }}
                alt=""
              />
              <p className="text-sm" style={{ color: P.textMuted }}>
                {t('educatorNotFound')}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="mt-1"
                style={{ color: P.textSecondary }}
              >
                {t('backBtn')}
              </Button>
            </div>
          )}

          {/* ── Loading ── */}
          {isPending && !isError && <ProfileSkeleton />}

          {/* ── Populated ── */}
          {educator && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-5"
            >
              {/* ── Hero card with sub-cover ── */}
              <motion.div variants={itemVariants}>
                <article
                  className="relative overflow-hidden rounded-2xl"
                  style={{ backgroundColor: P.card, border: `1px solid ${P.border}` }}
                >
                  {/* sub-cover band: tonal gradient, palette-locked, no glow soup */}
                  <div
                    aria-hidden
                    className="relative h-24 sm:h-28"
                    style={{
                      background: `linear-gradient(135deg, oklch(0.18 0.030 280) 0%, oklch(0.14 0.020 280) 60%, oklch(0.16 0.040 285) 100%)`,
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(ellipse at 80% 0%, oklch(0.70 0.16 280 / 0.18) 0%, transparent 55%)`,
                      }}
                    />
                  </div>

                  {/* Identity block, avatar overlapping cover */}
                  <div className="relative px-6 sm:px-7 pb-6 sm:pb-7 -mt-10 sm:-mt-12">
                    <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 sm:items-end">
                      <Avatar
                        className="shrink-0 rounded-2xl"
                        style={{
                          width: 88,
                          height: 88,
                          border: `3px solid ${P.card}`,
                          backgroundColor: P.surface,
                        }}
                      >
                        <AvatarImage
                          src={resolveIpfs(educator.photo_url)}
                          alt={displayName}
                          className="rounded-2xl object-cover"
                          width={88}
                          height={88}
                          fetchPriority="high"
                        />
                        <AvatarFallback
                          className="text-xl font-bold rounded-2xl"
                          style={{
                            backgroundColor: P.surface,
                            color: P.accent,
                            width: 88,
                            height: 88,
                          }}
                        >
                          {initials(educator.name, educator.lastname, educator.organization_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 sm:pb-1">
                        <div
                          className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-2"
                          style={{ color: P.accent }}
                        >
                          {t('educatorProfile.educatorRoleLabel')}
                        </div>
                        <h1
                          className="text-[1.55rem] sm:text-[1.75rem] font-bold leading-tight"
                          style={{ color: P.textPrimary }}
                        >
                          {displayName}
                        </h1>
                        {educator.organization_name !== displayName && (
                          <p
                            className="text-sm font-medium mt-1"
                            style={{ color: P.textSecondary }}
                          >
                            {educator.organization_name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* meta chips */}
                    <div className="flex flex-wrap items-center gap-2 mt-5">
                      {educator.wallet_address && <WalletChip address={educator.wallet_address} />}
                      <div
                        className="inline-flex items-center gap-1.5 px-3 text-[11px] rounded-md"
                        style={{
                          backgroundColor: P.surface,
                          border: `1px solid ${P.border}`,
                          color: P.textSecondary,
                          height: 34,
                        }}
                      >
                        <img
                          src="/icons/calendario.avif"
                          className="h-3.5 w-3.5 shrink-0 object-contain"
                          style={{ opacity: 0.55 }}
                          aria-hidden
                        />
                        {t('since')} {formatDate(educator.joined_at)}
                      </div>
                    </div>
                  </div>
                </article>
              </motion.div>

              {/* ── Stats strip ── */}
              <motion.div variants={itemVariants}>
                <div
                  className="rounded-2xl px-6 py-6 grid grid-cols-2 gap-2"
                  style={{ backgroundColor: P.card, border: `1px solid ${P.border}` }}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="flex items-center justify-center h-10 w-10 rounded-xl shrink-0"
                      style={{ backgroundColor: P.accentSoft }}
                    >
                      <img src="/icons/medalla.avif" className="h-6 w-6 object-contain" alt="" aria-hidden />
                    </span>
                    <div>
                      <div
                        className="text-[1.65rem] font-bold leading-none tabular-nums"
                        style={{ color: P.textPrimary }}
                      >
                        {educator.certificates_issued}
                      </div>
                      <div
                        className="text-[10px] uppercase tracking-[0.16em] font-semibold mt-1.5"
                        style={{ color: P.textMuted }}
                      >
                        {t('certificatesIssued')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:pl-6" style={{ borderLeft: `1px solid ${P.borderSub}` }}>
                    <span
                      className="flex items-center justify-center h-10 w-10 rounded-xl shrink-0"
                      style={{ backgroundColor: P.accentSoft }}
                    >
                      <img src="/icons/talentsPlattform.avif" className="h-6 w-6 object-contain" alt="" aria-hidden />
                    </span>
                    <div>
                      <div
                        className="text-[1.65rem] font-bold leading-none tabular-nums"
                        style={{ color: P.textPrimary }}
                      >
                        {educator.talents_formed}
                      </div>
                      <div
                        className="text-[10px] uppercase tracking-[0.16em] font-semibold mt-1.5"
                        style={{ color: P.textMuted }}
                      >
                        {t('talentsFormed')}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── About ── */}
              <motion.div variants={itemVariants}>
                <Section label={t('educatorProfile.aboutSection')}>
                  {educator.bio ? (
                    <p
                      className="text-[15px] leading-relaxed whitespace-pre-line"
                      style={{ color: P.textBio, maxWidth: '60ch' }}
                    >
                      {educator.bio}
                    </p>
                  ) : (
                    <p className="text-sm italic" style={{ color: P.textMuted }}>
                      {t('educatorProfile.noBio')}
                    </p>
                  )}
                </Section>
              </motion.div>

              {/* ── Knowledge areas ── */}
              {educator.knowledge_areas.length > 0 && (
                <motion.div variants={itemVariants}>
                  <Section label={t('educatorProfile.expertiseSection')}>
                    <div className="flex flex-wrap gap-2" role="list">
                      {educator.knowledge_areas.map((area) => (
                        <span key={area} role="listitem">
                          <KnowledgeChip label={area} />
                        </span>
                      ))}
                    </div>
                  </Section>
                </motion.div>
              )}

              {/* ── Connections (only if any) ── */}
              {hasAnyLinks && (
                <motion.div variants={itemVariants}>
                  <Section label={t('educatorProfile.linksSection')}>
                    <div className="space-y-2.5">
                      {educator.website_url && (
                        <SocialLink
                          icon={<Globe className="h-4 w-4" />}
                          label={t('educatorProfile.websiteLabel')}
                          url={educator.website_url}
                        />
                      )}
                      {educator.linkedin_url && (
                        <SocialLink
                          icon={<Linkedin className="h-4 w-4" />}
                          label={t('educatorProfile.linkedinLabel')}
                          url={educator.linkedin_url}
                        />
                      )}
                      {educator.twitter_url && (
                        <SocialLink
                          icon={<Twitter className="h-4 w-4" />}
                          label={t('educatorProfile.twitterLabel')}
                          url={educator.twitter_url}
                        />
                      )}
                    </div>
                  </Section>
                </motion.div>
              )}

              {/* ── On-chain verification ── */}
              <motion.div variants={itemVariants}>
                <Section
                  label={t('educatorProfile.verificationSection')}
                  icon={<ShieldCheck className="h-3.5 w-3.5" />}
                >
                  <div className="space-y-3">
                    <div
                      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                      style={{ backgroundColor: P.surface, border: `1px solid ${P.border}` }}
                    >
                      <div className="min-w-0">
                        <div
                          className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-1"
                          style={{ color: P.textMuted }}
                        >
                          {t('educatorProfile.issuerWalletLabel')}
                        </div>
                        <div className="text-sm font-mono truncate" style={{ color: P.textSecondary }}>
                          {educator.wallet_address}
                        </div>
                      </div>
                      <a
                        href={explorerUrl(educator.wallet_address)}
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
                        <span className="hidden sm:inline">{t('educatorProfile.viewOnExplorer')}</span>
                      </a>
                    </div>

                    {contractAddress && (
                      <div
                        className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                        style={{ backgroundColor: P.surface, border: `1px solid ${P.border}` }}
                      >
                        <div className="min-w-0">
                          <div
                            className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-1"
                            style={{ color: P.textMuted }}
                          >
                            {t('educatorProfile.contractLabel')}
                          </div>
                          <div className="text-sm font-mono truncate" style={{ color: P.textSecondary }}>
                            {shortAddress(contractAddress)}
                          </div>
                        </div>
                        <a
                          href={explorerUrl(contractAddress)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shrink-0 transition-colors"
                          style={{
                            backgroundColor: P.cardSoft,
                            color: P.textSecondary,
                            border: `1px solid ${P.border}`,
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{t('educatorProfile.viewOnExplorer')}</span>
                        </a>
                      </div>
                    )}
                  </div>
                </Section>
              </motion.div>

              {/* ── Issued certificates (placeholder) ── */}
              <motion.div variants={itemVariants}>
                <Section label={t('educatorProfile.certificatesGalleryLabel')}>
                  <ComingSoon
                    imgSrc="/icons/medalla.avif"
                    label={t('educatorProfile.comingSoon')}
                    hint={t('educatorProfile.certificatesGalleryHint')}
                  />
                </Section>
              </motion.div>

              {/* ── Talents formed (placeholder) ── */}
              <motion.div variants={itemVariants}>
                <Section label={t('educatorProfile.talentsListLabel')}>
                  <ComingSoon
                    imgSrc="/icons/talentsPlattform.avif"
                    label={t('educatorProfile.comingSoon')}
                    hint={t('educatorProfile.talentsListHint')}
                  />
                </Section>
              </motion.div>
            </motion.div>
          )}
        </motion.main>
      </div>
    </Layout>
  );
};

export default EducatorProfile;

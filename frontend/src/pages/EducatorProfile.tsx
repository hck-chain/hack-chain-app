import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import Layout from '@/components/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useEducatorProfile } from '@/hooks/useEducatorProfile';
import { useTranslation } from 'react-i18next';

const HackChainLogo = '/images/logoHackchain2.webp';

// OKLCH palette — hue 280 (violet), perceptually uniform, restrained + contained neon
// Background is oklch(~0.09) — cards need enough lightness delta to be clearly visible
const P = {
  card:          'oklch(0.21 0.018 280)',   // +0.12 over bg — clearly perceptible dark navy-violet
  surface:       'oklch(0.27 0.020 280)',   // chips / inner elements — second elevation step
  border:        'oklch(0.35 0.024 280)',   // visible border, not harsh
  borderSub:     'oklch(0.28 0.019 280)',   // divider / vertical separator
  textPrimary:   'oklch(0.94 0.008 280)',
  textSecondary: 'oklch(0.70 0.012 280)',
  textMuted:     'oklch(0.54 0.010 280)',
  textBio:       'oklch(0.80 0.010 280)',
  accent:        'oklch(0.68 0.16 280)',    // contained neon — stats + stripe only
  accentBorder:  'oklch(0.68 0.16 280 / 0.45)',
  accentBg:      'oklch(0.68 0.16 280 / 0.12)',
  avatarBg:      'oklch(0.25 0.025 280)',
  avatarText:    'oklch(0.75 0.13 280)',
  avatarBorder:  'oklch(0.38 0.030 280)',
} as const;

// expo ease-out — fast initial motion, smooth settle
const easeOutExpo = [0.16, 1, 0.3, 1] as const;

function resolveIpfs(url: string | null): string {
  if (!url) return '';
  return url.startsWith('ipfs://')
    ? `https://gateway.pinata.cloud/ipfs/${url.slice('ipfs://'.length)}`
    : url;
}

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
  return source
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// Reusable pulse block for skeleton
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
        {/* Identity block */}
        <div className="flex flex-col sm:flex-row gap-5">
          <Pulse w={76} h={76} radius={12} />
          <div className="flex-1 space-y-3 pt-1">
            <Pulse w={180} h={22} />
            <Pulse w={116} h={15} />
            <div className="flex flex-wrap gap-2 mt-1">
              <Pulse w={128} h={34} />
              <Pulse w={148} h={34} />
            </div>
            <Pulse w="100%" h={13} />
            <Pulse w="80%" h={13} />
          </div>
        </div>
        {/* Divider */}
        <div className="h-px" style={{ backgroundColor: P.borderSub }} />
        {/* Stats */}
        <div className="flex gap-10">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Pulse w={52} h={36} />
              <Pulse w={120} h={11} radius={4} />
            </div>
          ))}
        </div>
      </div>
      {/* Knowledge chips */}
      <div className="flex flex-wrap gap-2 px-1 pt-2">
        {[88, 128, 104, 96, 116].map((w, i) => (
          <div
            key={i}
            className="animate-pulse rounded-full"
            style={{ width: w, height: 36, backgroundColor: P.card }}
          />
        ))}
      </div>
    </div>
  );
}

// Wallet address chip — monospace, copy on click
function WalletChip({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — fail silently
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
      aria-label={`Wallet: ${address}. Clic para copiar`}
    >
      {copied ? (
        <Check size={11} style={{ color: P.accent, flexShrink: 0 }} aria-hidden />
      ) : (
        <img
          src="/icons/wallet.avif"
          className="h-3.5 w-3.5 shrink-0 object-contain"
          style={{ opacity: 0.55 }}
          aria-hidden
        />
      )}
      {`${address.slice(0, 6)}…${address.slice(-4)}`}
    </button>
  );
}

// Knowledge area chip — hover reveals accent
function KnowledgeChip({ label }: { label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <span
      className="inline-flex items-center px-3.5 py-2 rounded-full text-sm font-medium select-none cursor-default"
      style={{
        backgroundColor: hovered ? P.accentBg : P.surface,
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

  // Respect prefers-reduced-motion: instant when true, animated when false
  const dur = (ms: number) =>
    ({ duration: prefersReduced ? 0 : ms / 1000, ease: easeOutExpo }) as const;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: prefersReduced ? {} : { staggerChildren: 0.07 },
    },
  };

  const itemVariants = {
    hidden: { opacity: prefersReduced ? 1 : 0, y: prefersReduced ? 0 : 8 },
    visible: { opacity: 1, y: 0, transition: dur(280) },
  };

  return (
    <Layout>
      <div className="min-h-screen font-body">
        <motion.main
          initial={prefersReduced ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={dur(350)}
          className="relative z-10 px-4 sm:px-6 md:px-10 pt-10 pb-28 max-w-2xl mx-auto"
        >
          {/* ── Header ── */}
          <header className="mb-12 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 rounded-full px-3 -ml-2 transition-colors duration-150"
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

          {/* ── Loading state ── */}
          {isPending && !isError && <ProfileSkeleton />}

          {/* ── Populated state ── */}
          {educator && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-5"
            >
              {/* Main profile card */}
              <motion.div variants={itemVariants}>
                <article
                  className="relative overflow-hidden rounded-2xl"
                  style={{ backgroundColor: P.card, border: `1px solid ${P.border}` }}
                >
                  {/* Verification stripe — neon, left to fade */}
                  <div
                    aria-hidden
                    className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
                    style={{
                      background: `linear-gradient(90deg, ${P.accent} 0%, oklch(0.68 0.16 280 / 0.20) 50%, transparent 100%)`,
                    }}
                  />

                  {/* Single ambient glow — behind avatar corner only */}
                  <div
                    aria-hidden
                    className="absolute top-0 left-0 w-72 h-72 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 0% 0%, oklch(0.68 0.16 280 / 0.07) 0%, transparent 60%)`,
                    }}
                  />

                  <div className="relative z-10 p-6 sm:p-7">
                    {/* Identity row */}
                    <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
                      <Avatar
                        className="shrink-0 rounded-xl"
                        style={{ width: 76, height: 76 }}
                      >
                        <AvatarImage
                          src={resolveIpfs(educator.photo_url)}
                          alt={displayName}
                          className="rounded-xl object-cover"
                        />
                        <AvatarFallback
                          className="text-lg font-bold rounded-xl"
                          style={{
                            backgroundColor: P.avatarBg,
                            color: P.avatarText,
                            border: `1px solid ${P.avatarBorder}`,
                            width: 76,
                            height: 76,
                          }}
                        >
                          {initials(educator.name, educator.lastname, educator.organization_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h1
                          className="text-xl sm:text-[1.35rem] font-bold leading-tight"
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

                        {/* Metadata chips */}
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          {educator.wallet_address && (
                            <WalletChip address={educator.wallet_address} />
                          )}

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

                        {educator.bio && (
                          <p
                            className="text-sm leading-relaxed mt-5"
                            style={{ color: P.textBio, maxWidth: '58ch' }}
                          >
                            {educator.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div
                      className="mt-6 mb-5 h-px"
                      style={{ backgroundColor: P.borderSub }}
                    />

                    {/* Stats — neon numbers, the only accent-heavy element */}
                    <div className="flex items-end gap-8 sm:gap-10">
                      <div className="flex flex-col gap-1.5">
                        <span
                          className="text-[2rem] font-bold leading-none tabular-nums"
                          style={{
                            color: P.accent,
                            textShadow: '0 0 22px oklch(0.68 0.16 280 / 0.38)',
                          }}
                        >
                          {educator.certificates_issued}
                        </span>
                        <span
                          className="text-[10px] uppercase tracking-widest font-semibold"
                          style={{ color: P.textMuted }}
                        >
                          {t('certificatesIssued')}
                        </span>
                      </div>

                      <div
                        className="w-px shrink-0"
                        style={{ height: 40, backgroundColor: P.borderSub }}
                      />

                      <div className="flex flex-col gap-1.5">
                        <span
                          className="text-[2rem] font-bold leading-none tabular-nums"
                          style={{
                            color: P.accent,
                            textShadow: '0 0 22px oklch(0.68 0.16 280 / 0.38)',
                          }}
                        >
                          {educator.talents_formed}
                        </span>
                        <span
                          className="text-[10px] uppercase tracking-widest font-semibold"
                          style={{ color: P.textMuted }}
                        >
                          {t('talentsFormed')}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </motion.div>

              {/* Knowledge areas — no wrapper card, just section */}
              {educator.knowledge_areas.length > 0 && (
                <motion.div variants={itemVariants} className="px-1 pt-4">
                  <h2
                    className="text-[10px] uppercase tracking-widest font-semibold mb-4 flex items-center gap-2"
                    style={{ color: P.textMuted }}
                  >
                    <img
                      src="/icons/libroNeon.avif"
                      className="h-3.5 w-3.5 object-contain"
                      style={{ opacity: 0.40 }}
                      aria-hidden
                    />
                    {t('knowledgeAreas.label')}
                  </h2>

                  <div className="flex flex-wrap gap-2" role="list" aria-label={t('knowledgeAreas.label')}>
                    {educator.knowledge_areas.map((area) => (
                      <span key={area} role="listitem">
                        <KnowledgeChip label={area} />
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Coming soon — honest placeholder */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center justify-center py-14 text-center"
              >
                <div
                  className="h-px w-16 mb-8"
                  style={{ backgroundColor: P.borderSub }}
                />
                <img
                  src="/icons/graduado.avif"
                  className="h-7 w-7 mb-3 object-contain"
                  style={{ opacity: 0.15 }}
                  alt=""
                />
                <p
                  className="text-[10px] uppercase tracking-widest font-semibold"
                  style={{ color: P.textMuted }}
                >
                  {t('comingSoonContent')}
                </p>
              </motion.div>
            </motion.div>
          )}
        </motion.main>
      </div>
    </Layout>
  );
};

export default EducatorProfile;

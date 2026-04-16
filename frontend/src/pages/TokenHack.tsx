import { useTranslation } from 'react-i18next';
import { motion, TargetAndTransition } from 'framer-motion';
import {
  PiRocketLaunchFill,
  PiLightbulbFilamentFill,
  PiMagnifyingGlassFill,
  PiShareNetworkFill,
  PiChartLineUpFill,
  PiCrownSimpleFill,
  PiCoinsFill,
  PiHexagonFill,
  PiFileTextFill,
  PiArrowRightBold,
  PiEnvelopeSimpleFill,
  PiCheckCircleFill,
  PiStarFill,
  PiShieldCheckFill,
  PiUsersThreeFill,
  PiKeyFill,
  PiTrophyFill,
  PiHandshakeFill,
  PiLockKeyFill,
} from 'react-icons/pi';
import Layout from '@/components/Layout';
import Navbar from '@/components/Navbar';
import TokenDistributionChart from '@/components/TokenDistributionChart';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';
import { AnimeParticles } from '@/components/animations/AnimeComponents';

// ─── Animation variants ───────────────────────────────────────────────────────

type AnimVariant = 'float' | 'pulse' | 'spin' | 'bounce' | 'swing' | 'breathe';

const ANIM_LOOPS: Record<AnimVariant, TargetAndTransition> = {
  float: { y: [0, -6, 0], transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } },
  breathe: { scale: [1, 1.18, 1], transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } },
  spin: { rotate: [0, 360], transition: { duration: 8, repeat: Infinity, ease: 'linear' } },
  bounce: { y: [0, -8, 0, -4, 0], transition: { duration: 1.8, repeat: Infinity, ease: 'easeOut', repeatDelay: 1.2 } },
  swing: { rotate: [0, 14, -14, 8, -8, 0], transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.8 } },
  pulse: { scale: [1, 1.25, 1], opacity: [0.85, 1, 0.85], transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } },
};

const AnimatedIcon = ({
  Icon, className = '', delay = 0, variant = 'float',
}: {
  Icon: React.ComponentType<{ className?: string }>;
  className?: string;
  delay?: number;
  variant?: AnimVariant;
}) => (
  <motion.div
    initial={{ scale: 0, rotate: -180, opacity: 0 }}
    whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
    viewport={{ once: true }}
    transition={{ type: 'spring', stiffness: 200, damping: 15, delay }}
  >
    <motion.div animate={ANIM_LOOPS[variant]} style={{ originX: '50%', originY: '50%' }}>
      <Icon className={className} />
    </motion.div>
  </motion.div>
);

// ─── Shared fade-up variant ───────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.12 } },
  viewport: { once: true, margin: '-80px' },
};

const staggerItem = {
  initial: { opacity: 0, y: 25 },
  whileInView: { opacity: 1, y: 0 },
};

// ─── Reusable section header ──────────────────────────────────────────────────

const SectionHeader = ({ title, highlight, subtitle }: { title: string; highlight: string; subtitle?: string }) => (
  <motion.div {...fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
    <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
      {title}
      <span className="gradient-text">{highlight}</span>
    </h2>
    {subtitle && (
      <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    )}
  </motion.div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const TokenHack = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <Navbar />
      <main className="pt-28 sm:pt-32 pb-24">


        {/* ═══════════════════════════════════════════════════════════
            SECTION 1: Hero — Token logo + tagline + quick stats
        ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 sm:mb-32">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="glass rounded-3xl p-8 sm:p-12 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
            
            {/* Anime.js Background Particles */}
            <AnimeParticles />

            <div className="relative z-10">
              {/* Token logo — large + glow */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1, type: 'spring', stiffness: 200 }}
                className="mx-auto mb-10 relative w-40 h-40 sm:w-48 sm:h-48"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 blur-2xl scale-110 pointer-events-none" />
                <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                  <img
                    src="/Token_2.png"
                    alt="HACK Token"
                    className="w-full h-full object-contain p-3 drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]"
                  />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="font-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tighter"
              >
                {t('token.heroTitle1')}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]">
                  {t('token.heroTitle2')}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="font-body text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10"
              >
                {t('token.heroTagline')}
              </motion.p>

              {/* Quick stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex flex-wrap justify-center gap-4 sm:gap-6"
              >
                {[
                  { label: t('token.totalSupply'), value: t('token.totalSupplyValue'), Icon: PiCoinsFill },
                  { label: t('token.network'), value: t('token.networkValue'), Icon: PiHexagonFill },
                  { label: t('token.standard'), value: t('token.standardValue'), Icon: PiFileTextFill },
                ].map((stat, idx) => (
                  <div
                    key={stat.label}
                    className="glass rounded-xl px-5 py-3 sm:px-6 sm:py-4 flex items-center gap-3 border border-white/5"
                  >
                    <AnimatedIcon Icon={stat.Icon} className="w-5 h-5 text-purple-400" delay={0.8 + idx * 0.15} variant="breathe" />
                    <div className="text-left">
                      <p className="font-body text-xs text-muted-foreground">{stat.label}</p>
                      <p className="font-title text-sm sm:text-base font-semibold text-foreground">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </section>


        {/* ═══════════════════════════════════════════════════════════
            SECTION 2: ¿Qué es $HACK? — Split layout (Reental style)
            Left: mission bullets | Right: visual card
        ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 sm:mb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left — Text */}
            <motion.div {...fadeUp} transition={{ duration: 0.6 }}>
              <p className="font-title text-sm font-bold text-purple-400 uppercase tracking-widest mb-3">
                {t('token.whatIs')}
              </p>
              <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                {t('token.ecosystemTitle')}
                <span className="gradient-text">{t('token.ecosystemHighlight')}</span>
              </h2>
              <p className="font-body text-lg text-muted-foreground leading-relaxed mb-8">
                {t('token.ecosystemDesc')}
              </p>

              {/* Mission bullets — Reental style */}
              <ul className="space-y-4">
                {[
                  'Reward Talent, Educators, and Recruiters for their merits',
                  'Power a transparent and trustless credential economy',
                  'Grow a community-driven education ecosystem in LATAM',
                ].map((text, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <PiCheckCircleFill className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="font-body text-foreground/80">{text}</span>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-8"
              >
                <a href="/docs/Token_Whitepaper.pdf" target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    className="font-title border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/10 group"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {t('token.whitepaperBtn')}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
              </motion.div>
            </motion.div>

            {/* Right — Visual card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="glass rounded-3xl p-8 sm:p-10 relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px]" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px]" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <AnimatedIcon Icon={PiTrophyFill} className="w-5 h-5 text-white" variant="bounce" />
                  </div>
                  <span className="font-title font-bold text-lg">Token HACK Objectives</span>
                </div>

                <div className="space-y-4">
                  {[
                    { Icon: PiUsersThreeFill, label: 'Community Growth', desc: 'Empower every participant in our ecosystem', color: 'text-purple-400' },
                    { Icon: PiShieldCheckFill, label: 'Platform Development', desc: 'Drive product improvements through governance', color: 'text-blue-400' },
                    { Icon: PiHandshakeFill, label: 'User Engagement', desc: 'Reward and retain the most committed members', color: 'text-pink-400' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <item.Icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${item.color}`} />
                      <div>
                        <p className="font-title font-semibold text-sm text-foreground">{item.label}</p>
                        <p className="font-body text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Divider + slogan */}
                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                  <p className="font-title text-sm font-bold text-foreground/60 italic">
                    "{t('token.communitySlogan')}"
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════════════
            SECTION 3: Características — 3 feature cards (Reental style)
            DeFi → Learn   |   Comunidad → Network   |   Real Estate → Hire
        ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 sm:mb-32">
          <SectionHeader
            title="Token "
            highlight="Features"
            subtitle="Discover how Token HACK powers every interaction across the HackChain ecosystem"
          />

          <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                Icon: PiRocketLaunchFill,
                label: 'For Talent',
                title: t('token.talentTitle'),
                desc: t('token.talentDesc'),
                perks: ['Earn Token HACK for completing courses', 'Spend Token HACK on premium certifications', 'Priority access to job postings'],
                gradient: 'from-purple-500 to-pink-500',
                glow: 'rgba(168, 85, 247, 0.15)',
                variant: 'bounce' as AnimVariant,
              },
              {
                Icon: PiLightbulbFilamentFill,
                label: 'For Educators',
                title: t('token.educatorTitle'),
                desc: t('token.educatorDesc'),
                perks: ['Receive Token HACK for issued certificates', 'Access educator-only governance tools', 'Expand your student reach'],
                gradient: 'from-blue-500 to-cyan-500',
                glow: 'rgba(59, 130, 246, 0.15)',
                variant: 'pulse' as AnimVariant,
              },
              {
                Icon: PiMagnifyingGlassFill,
                label: 'For Recruiters',
                title: t('token.recruiterTitle'),
                desc: t('token.recruiterDesc'),
                perks: ['Use Token HACK to unlock talent profiles', 'Verify credentials in one click', 'Access exclusive talent pool'],
                gradient: 'from-green-500 to-emerald-500',
                glow: 'rgba(34, 197, 94, 0.15)',
                variant: 'swing' as AnimVariant,
              },
            ].map((card, idx) => (
              <motion.div
                key={card.title}
                variants={staggerItem}
                transition={{ duration: 0.5 }}
                className="glass rounded-2xl glass-hover group relative overflow-hidden flex flex-col"
              >
                {/* Top accent line — Reental style */}
                <div className={`h-1 w-full bg-gradient-to-r ${card.gradient} rounded-t-2xl`} />

                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${card.glow}, transparent 70%)` }}
                />

                <div className="relative z-10 p-6 sm:p-8 flex-1 flex flex-col">
                  {/* Pill label */}
                  <span className={`self-start mb-4 text-xs font-title font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent border border-white/10 rounded-full px-3 py-1`}>
                    {card.label}
                  </span>

                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${card.gradient} flex items-center justify-center mb-5`}>
                    <AnimatedIcon Icon={card.Icon} className="w-7 h-7 text-white" delay={idx * 0.15} variant={card.variant} />
                  </div>

                  <h3 className="font-title text-xl sm:text-2xl font-bold mb-3 gradient-text">{card.title}</h3>
                  <p className="font-body text-muted-foreground leading-relaxed mb-5">{card.desc}</p>

                  {/* Perks list — Reental style */}
                  <ul className="mt-auto space-y-2">
                    {card.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2 text-sm font-body text-foreground/70">
                        <PiCheckCircleFill className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>


        {/* ═══════════════════════════════════════════════════════════
            SECTION 4: Finance — 3 earning methods (referral/staking/sale)
        ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 sm:mb-32">
          <SectionHeader title={t('token.financeTitle')} highlight={t('token.financeHighlight')} />

          <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                Icon: PiShareNetworkFill,
                title: t('token.referralTitle'),
                desc: t('token.referralDesc'),
                gradient: 'from-amber-500 to-orange-500',
                glow: 'rgba(245, 158, 11, 0.15)',
                variant: 'spin' as AnimVariant,
              },
              {
                Icon: PiChartLineUpFill,
                title: t('token.stakingTitle'),
                desc: t('token.stakingDesc'),
                gradient: 'from-green-500 to-emerald-500',
                glow: 'rgba(34, 197, 94, 0.15)',
                variant: 'float' as AnimVariant,
              },
              {
                Icon: PiCrownSimpleFill,
                title: t('token.privateSaleTitle'),
                desc: t('token.privateSaleDesc'),
                gradient: 'from-purple-500 to-indigo-500',
                glow: 'rgba(124, 58, 237, 0.15)',
                cta: true,
                variant: 'pulse' as AnimVariant,
              },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                variants={staggerItem}
                transition={{ duration: 0.5 }}
                className="glass rounded-2xl p-6 sm:p-8 glass-hover group relative overflow-hidden flex flex-col"
              >
                <div className={`h-1 w-full bg-gradient-to-r ${item.gradient} rounded-full mb-6`} />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${item.glow}, transparent 70%)` }}
                />
                <div className="relative z-10 flex-1">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${item.gradient} flex items-center justify-center mb-5`}>
                    <AnimatedIcon Icon={item.Icon} className="w-7 h-7 text-white" delay={idx * 0.15} variant={item.variant} />
                  </div>
                  <h3 className="font-title text-xl sm:text-2xl font-bold mb-3 gradient-text">{item.title}</h3>
                  <p className="font-body text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>

                {item.cta && (
                  <div className="relative z-10 mt-6">
                    <a href="/contact">
                      <Button
                        variant="outline"
                        className="w-full font-title border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/10 text-foreground group/btn"
                      >
                        <PiEnvelopeSimpleFill className="w-4 h-4 mr-2" />
                        {t('token.privateSaleCta')}
                        <PiArrowRightBold className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </a>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </section>


        {/* ═══════════════════════════════════════════════════════════
            SECTION 5: Token Distribution chart
        ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 sm:mb-32">
          <div className="glass rounded-3xl p-6 sm:p-10 md:p-14 mb-10 relative overflow-hidden">
            <AnimeParticles />
            <div className="relative z-10">
              <SectionHeader
                title={t('token.distributionTitle')}
                highlight={t('token.distributionHighlight')}
                subtitle={t('token.distributionDesc')}
              />
              <TokenDistributionChart />
            </div>
          </div>

          <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.3 }} className="text-center">
            <a href="/docs/Token_Whitepaper.pdf" target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="font-title text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/20 px-8 py-6 rounded-xl group"
              >
                <FileText className="w-5 h-5 mr-2" />
                {t('token.whitepaperBtn')}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
            <p className="font-body text-sm text-muted-foreground mt-4">
              {t('token.whitepaperSubtext')}
            </p>
          </motion.div>
        </section>





        {/* ═══════════════════════════════════════════════════════════
            SECTION 9: Bottom CTA — Get Started centered
        ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.8 }}
            className="glass rounded-3xl p-8 sm:p-12 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {t('token.ctaTitle')}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                  {t('token.ctaHighlight')}
                </span>
              </h2>

              <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
                {t('token.ctaDesc')}
              </p>

              <a href="/register">
                <Button
                  size="lg"
                  className="font-title text-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/20 px-10 py-6 rounded-xl group"
                >
                  {t('nav.getStarted')}
                  <PiArrowRightBold className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </div>
          </motion.div>
        </section>


      </main>
    </Layout>
  );
};

export default TokenHack;

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { PiArrowRightBold, PiEnvelopeSimpleFill, PiCheckCircleFill } from 'react-icons/pi';
import Layout from '@/components/Layout';
import Navbar from '@/components/Navbar';
import TokenDistributionChart from '@/components/TokenDistributionChart';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';
import { AnimeParticles } from '@/components/animations/AnimeComponents';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' } as const,
};

const SectionEyebrow = ({ label }: { label: string }) => (
  <div className="flex items-center gap-6 mb-16">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
    <span className="font-title text-[10px] uppercase tracking-[0.32em] text-white/25 font-bold select-none shrink-0">
      {label}
    </span>
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
  </div>
);

const SectionHeader = ({ title, highlight, subtitle }: { title: string; highlight: string; subtitle?: string }) => (
  <motion.div {...fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
    <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
      {title}<span className="gradient-text">{highlight}</span>
    </h2>
    {subtitle && (
      <p className="font-body text-lg text-white/45 max-w-3xl mx-auto leading-relaxed font-medium">
        {subtitle}
      </p>
    )}
  </motion.div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const TokenHack = () => {
  const { t } = useTranslation();
  const [activeRole, setActiveRole] = useState(0);

  const roles = [
    {
      imgSrc: '/icons/talent.avif',
      label: t('token.forTalent'),
      title: t('token.talentTitle'),
      desc: t('token.talentDesc'),
      perks: [t('token.talentPerk1'), t('token.talentPerk2'), t('token.talentPerk3')],
      claySrc: 'from-purple-500/80 via-fuchsia-500/65 to-purple-700/50',
      shadow: 'shadow-clay-purple',
      accent: 'text-purple-400',
    },
    {
      imgSrc: '/icons/libro.avif',
      label: t('token.forEducators'),
      title: t('token.educatorTitle'),
      desc: t('token.educatorDesc'),
      perks: [t('token.educatorPerk1'), t('token.educatorPerk2'), t('token.educatorPerk3')],
      claySrc: 'from-cyan-400/80 via-sky-500/65 to-blue-700/50',
      shadow: 'shadow-clay-cyan',
      accent: 'text-cyan-400',
    },
    {
      imgSrc: '/icons/maletin.avif',
      label: t('token.forRecruiters'),
      title: t('token.recruiterTitle'),
      desc: t('token.recruiterDesc'),
      perks: [t('token.recruiterPerk1'), t('token.recruiterPerk2'), t('token.recruiterPerk3')],
      claySrc: 'from-emerald-400/80 via-green-500/65 to-emerald-700/50',
      shadow: 'shadow-clay-emerald',
      accent: 'text-emerald-400',
    },
  ];

  const objectives = [
    {
      imgSrc: '/icons/talentsPlattform.avif',
      label: t('token.objCommunityLabel'),
      desc: t('token.objCommunityDesc'),
      claySrc: 'from-purple-500/80 via-fuchsia-500/65 to-purple-700/50',
      shadow: 'shadow-clay-purple',
    },
    {
      imgSrc: '/icons/escudo.avif',
      label: t('token.objPlatformLabel'),
      desc: t('token.objPlatformDesc'),
      claySrc: 'from-cyan-400/80 via-sky-500/65 to-blue-700/50',
      shadow: 'shadow-clay-cyan',
    },
    {
      imgSrc: '/icons/medalla.avif',
      label: t('token.objUserLabel'),
      desc: t('token.objUserDesc'),
      claySrc: 'from-pink-400/80 via-rose-500/65 to-pink-700/50',
      shadow: 'shadow-clay-pink',
    },
  ];

  const financeSteps = [
    {
      number: '01',
      imgSrc: '/icons/mundo.avif',
      title: t('token.referralTitle'),
      desc: t('token.referralDesc'),
      claySrc: 'from-amber-300/80 via-orange-500/65 to-orange-700/50',
      shadow: 'shadow-clay-amber',
      cta: false,
    },
    {
      number: '02',
      imgSrc: '/icons/rayo.avif',
      title: t('token.stakingTitle'),
      desc: t('token.stakingDesc'),
      claySrc: 'from-emerald-400/80 via-green-500/65 to-emerald-700/50',
      shadow: 'shadow-clay-emerald',
      cta: false,
    },
    {
      number: '03',
      imgSrc: '/icons/documento.avif',
      title: t('token.privateSaleTitle'),
      desc: t('token.privateSaleDesc'),
      claySrc: 'from-purple-500/80 via-fuchsia-500/65 to-purple-700/50',
      shadow: 'shadow-clay-purple',
      cta: true,
    },
  ];

  const activeRoleData = roles[activeRole];

  return (
    <Layout>
      <Navbar />
      <main className="pt-28 sm:pt-32 pb-24">


        {/* ═══════════════════════════════════════════════════════════
            SECTION 1 — Hero: $HACK sobre el void
        ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32 sm:mb-40 relative overflow-hidden">

          {/* Ambient glow — sin superficie, solo luz */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-purple-500/[0.07] rounded-full blur-[140px] pointer-events-none" />
          <AnimeParticles />

          <div className="relative z-10 text-center">

            {/* Eyebrow con ticker vivo */}
            <div className="flex items-center gap-6 mb-16 max-w-sm mx-auto">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/25 font-bold select-none shrink-0 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ERC-20 · Polygon
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
            </div>

            {/* Token 3D — moneda interactiva con Three.js */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.1, type: 'spring', stiffness: 100, damping: 18 }}
              className="flex justify-center mb-16"
            >
<div className="relative w-80 h-80 sm:w-96 sm:h-96">
  <div className="absolute inset-0 rounded-full bg-violet-600/10 blur-3xl scale-[1.5] pointer-events-none" />
  <video
    autoPlay
    loop
    muted
    playsInline
    className="w-full h-full object-contain relative z-10 scale-[2.8]"
  >
    <source src="/videos/tokenAnimation.mov" type="video/mp4; codecs=hvc1" />
    <source src="/videos/tokenAnimation.webm" type="video/webm" />
  </video>
</div>
            </motion.div>

            {/* $HACK — signature ticker */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="font-title text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-6 tracking-tighter leading-none"
            >
              <span className="font-mono text-purple-400/55" style={{ fontSize: '0.7em', verticalAlign: 'baseline' }}>$</span>
              {t('token.heroTitle1').trim()}
              <span className="gradient-text">{t('token.heroTitle2')}</span>
              <span className="font-mono text-purple-400/20 animate-pulse" aria-hidden>_</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.5 }}
              className="font-body text-lg sm:text-xl text-white/50 max-w-3xl mx-auto leading-relaxed font-medium mb-16"
            >
              {t('token.heroTagline')}
            </motion.p>

                        <div className="mb-16">
              <a href="/presale">
                <Button
                  size="lg"
                  className="font-title text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/20 px-10 py-6 rounded-xl group"
                >
                  Join the Presale
                  <PiArrowRightBold className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </div>

            {/* Stats — 3 columnas abiertas, sin bordes */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-wrap justify-center gap-x-16 gap-y-8"
            >
              {[
                { label: t('token.totalSupply'), value: t('token.totalSupplyValue') },
                { label: t('token.network'),     value: t('token.networkValue') },
                { label: t('token.standard'),    value: t('token.standardValue') },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-2">
                  <span className="font-body text-xs text-white/25 uppercase tracking-[0.2em] font-semibold">
                    {stat.label}
                  </span>
                  <span className="font-mono text-base sm:text-lg font-bold gradient-text">
                    {stat.value}
                  </span>
                </div>
              ))}
            </motion.div>

          </div>
        </section>


        {/* ═══════════════════════════════════════════════════════════
            SECTION 2 — ¿Qué es $HACK? (split abierto)
        ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32 sm:mb-40">
          <SectionEyebrow label={t('token.whatIs')} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            {/* Left — texto abierto */}
            <motion.div {...fadeUp} transition={{ duration: 0.6 }}>
              <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                {t('token.ecosystemTitle')}
                <span className="gradient-text">{t('token.ecosystemHighlight')}</span>
              </h2>
              <p className="font-body text-lg text-white/50 leading-relaxed mb-10 font-medium">
                {t('token.ecosystemDesc')}
              </p>

              <ul className="space-y-5 mb-10">
                {(t('token.ecosystemBullets', { returnObjects: true }) as string[]).map((text: string, idx: number) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <PiCheckCircleFill className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="font-body text-white/70">{text}</span>
                  </motion.li>
                ))}
              </ul>

              <a href="/docs/Token_Whitepaper.pdf" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="font-title border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/10 group">
                  <FileText className="w-4 h-4 mr-2" />
                  {t('token.whitepaperBtn')}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </motion.div>

            {/* Right — objetivos con clay icons, sin card */}
            <div className="flex flex-col gap-10">
              {objectives.map((obj, idx) => (
                <motion.div
                  key={obj.label}
                  initial={{ opacity: 0, x: 28 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 80, damping: 18, delay: idx * 0.13 }}
                  className="flex items-center gap-7"
                >
                  <motion.div
                    className={`clay-icon w-16 h-16 flex-shrink-0 bg-gradient-to-br ${obj.claySrc} ${obj.shadow}`}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 4 + idx, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <img
                      src={obj.imgSrc}
                      alt={obj.label}
                      className="w-9 h-9 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                    />
                  </motion.div>
                  <div>
                    <p className="font-title font-black text-base text-white mb-1 tracking-tight">{obj.label}</p>
                    <p className="font-body text-sm text-white/40">{obj.desc}</p>
                  </div>
                </motion.div>
              ))}

              <p className="font-title text-sm font-bold text-white/30 italic pl-[5.75rem]">
                "{t('token.communitySlogan')}"
              </p>
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════════════
            SECTION 3 — Roles: tab panel abierto con clay icons
        ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32 sm:mb-40">
          <SectionEyebrow label="Token Features" />
          <SectionHeader
            title="Token "
            highlight="Features"
            subtitle="Discover how Token HACK powers every interaction across the HackChain ecosystem"
          />

          {/* Selectores de rol — texto puro, sin bordes */}
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 mb-16">
            {roles.map((role, idx) => (
              <button
                key={idx}
                onClick={() => setActiveRole(idx)}
                className={`font-title text-base font-bold uppercase tracking-[0.12em] transition-all duration-300 ${
                  activeRole === idx
                    ? 'gradient-text'
                    : 'text-white/25 hover:text-white/50'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          {/* Panel de contenido — completamente abierto */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRole}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.26, ease: 'easeOut' }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-12 lg:gap-20 items-center"
            >
              {/* Clay icon + identidad del rol */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                <motion.div
                  className={`clay-icon w-28 h-28 sm:w-36 sm:h-36 mb-8 bg-gradient-to-br ${activeRoleData.claySrc} ${activeRoleData.shadow}`}
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <img
                    src={activeRoleData.imgSrc}
                    alt={activeRoleData.title}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)]"
                  />
                </motion.div>

                <h3 className="font-title text-4xl sm:text-5xl font-black gradient-text leading-tight mb-3 tracking-tight">
                  {activeRoleData.title}
                </h3>
                <span className="font-body text-xs text-white/25 uppercase tracking-[0.2em] font-semibold">
                  {activeRoleData.label}
                </span>
              </div>

              {/* Descripción + perks abiertos */}
              <div>
                <p className="font-body text-lg text-white/50 leading-relaxed mb-10 font-medium">
                  {activeRoleData.desc}
                </p>
                <div className="space-y-5">
                  {activeRoleData.perks.map((perk, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className={`font-mono text-xs font-bold ${activeRoleData.accent} w-6 flex-shrink-0 select-none`}>
                        0{i + 1}
                      </span>
                      <PiCheckCircleFill className={`w-4 h-4 ${activeRoleData.accent} flex-shrink-0`} />
                      <span className="font-body text-base text-white/60">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>


        {/* ═══════════════════════════════════════════════════════════
            SECTION 4 — Finance: step flow con clay icons
        ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32 sm:mb-40">
          <SectionEyebrow label={`${t('token.financeTitle')}${t('token.financeHighlight')}`} />
          <SectionHeader title={t('token.financeTitle')} highlight={t('token.financeHighlight')} />

          <div className="relative">
            {/* Línea conectora — desktop */}
            <div
              className="hidden md:block absolute top-9 h-px pointer-events-none"
              style={{
                left: 'calc(16.67% + 36px)',
                right: 'calc(16.67% + 36px)',
                background: 'linear-gradient(90deg, rgba(245,158,11,0.25), rgba(34,197,94,0.25), rgba(168,85,247,0.25))',
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-14 md:gap-10">
              {financeSteps.map((step, idx) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ type: 'spring', stiffness: 80, damping: 18, delay: idx * 0.15 }}
                  className="flex flex-col"
                >
                  {/* Clay icon + número fantasma */}
                  <div className="flex items-center gap-5 mb-8">
                    <motion.div
                      className={`clay-icon w-[4.5rem] h-[4.5rem] flex-shrink-0 bg-gradient-to-br ${step.claySrc} ${step.shadow} relative z-10`}
                      animate={{ y: [0, -7, 0] }}
                      transition={{ duration: 4 + idx * 0.8, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <img
                        src={step.imgSrc}
                        alt={step.title}
                        className="w-9 h-9 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                      />
                    </motion.div>
                    <span className="font-mono text-6xl font-black text-white/[0.05] leading-none select-none">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="font-title text-xl font-black text-white mb-3 tracking-tight">{step.title}</h3>
                  <p className="font-body text-sm text-white/40 leading-relaxed flex-1">{step.desc}</p>

                  {step.cta && (
                    <div className="mt-8">
                      <a href="/contact">
                        <Button
                          variant="outline"
                          className="w-full font-title border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/10 group"
                        >
                          <PiEnvelopeSimpleFill className="w-4 h-4 mr-2" />
                          {t('token.privateSaleCta')}
                          <PiArrowRightBold className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </a>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════════════
            SECTION 5 — Token Distribution: chart sobre el void
        ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32 sm:mb-40">
          <SectionEyebrow label={`${t('token.distributionTitle')}${t('token.distributionHighlight')}`} />
          <SectionHeader
            title={t('token.distributionTitle')}
            highlight={t('token.distributionHighlight')}
            subtitle={t('token.distributionDesc')}
          />

          {/* Glow ambiental sutil — sin superficie */}
          <div className="relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-500/[0.05] rounded-full blur-[120px] pointer-events-none" />
            <div className="relative z-10">
              <TokenDistributionChart />
            </div>
          </div>

          <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.3 }} className="text-center mt-16">
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
            <p className="font-body text-sm text-white/25 mt-4">
              {t('token.whitepaperSubtext')}
            </p>
          </motion.div>
        </section>


        {/* ═══════════════════════════════════════════════════════════
            SECTION 6 — CTA: texto puro al estilo CallToAction
        ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          {/* $HACK eyebrow */}
          <div className="flex items-center gap-6 mb-14 max-w-xs mx-auto">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/25 font-bold select-none shrink-0 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              $HACK
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
          </div>

          <motion.h2
            className="font-title text-4xl sm:text-6xl md:text-7xl font-black mb-8 leading-[1.02] tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          >
            {t('token.ctaTitle')}
            <span className="gradient-text">{t('token.ctaHighlight')}</span>
          </motion.h2>

          <motion.p
            className="font-body text-lg md:text-xl lg:text-2xl text-white/50 mb-14 leading-relaxed font-medium max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.1 }}
          >
            {t('token.ctaDesc')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.2 }}
          >
            <a href="/register">
              <Button
                size="lg"
                className="font-title text-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/20 px-10 py-6 rounded-xl group"
              >
                {t('nav.getStarted')}
                <PiArrowRightBold className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
          </motion.div>

        </section>

      </main>
    </Layout>
  );
};

export default TokenHack;

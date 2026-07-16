import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const ValueProposition = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 80%', 'end 60%'],
  });

  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const steps = [
    {
      imgSrc: '/icons/talent.avif',
      alt: 'Talent',
      title: t('valueProp.step1Title'),
      desc: t('valueProp.step1Desc'),
      claySrc: 'from-purple-500/80 via-fuchsia-500/65 to-purple-700/50',
      shadow: 'shadow-clay-purple',
    },
    {
      imgSrc: '/icons/libro.avif',
      alt: 'Educator',
      title: t('valueProp.step2Title'),
      desc: t('valueProp.step2Desc'),
      claySrc: 'from-cyan-400/80 via-sky-500/65 to-blue-700/50',
      shadow: 'shadow-clay-cyan',
    },
    {
      imgSrc: '/icons/maletin.avif',
      alt: 'Recruiter',
      title: t('valueProp.step3Title'),
      desc: t('valueProp.step3Desc'),
      claySrc: 'from-emerald-400/80 via-green-500/65 to-emerald-700/50',
      shadow: 'shadow-clay-emerald',
    },
  ];

  return (
    <section id="community" className="pb-32 md:pb-48 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={sectionRef}>

        <motion.div
          className="text-center mb-24 md:mb-32"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        >
          <h2 className="font-title text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-8 leading-[1.05]">
            {t('valueProp.title1')}
            <span className="gradient-text">{t('valueProp.title2')}</span>
          </h2>

          <p className="font-body text-lg md:text-xl text-white/55 max-w-2xl mx-auto font-medium">
            {t('valueProp.subTitle')}
          </p>
        </motion.div>

        <div className="relative">
          {/* Luminous path — desktop horizontal */}
          <svg
            className="hidden lg:block absolute top-10 left-0 w-full h-32 pointer-events-none"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(280 100% 65%)" stopOpacity="0" />
                <stop offset="20%" stopColor="hsl(280 100% 65%)" stopOpacity="1" />
                <stop offset="50%" stopColor="hsl(200 100% 65%)" stopOpacity="1" />
                <stop offset="80%" stopColor="hsl(160 100% 55%)" stopOpacity="1" />
                <stop offset="100%" stopColor="hsl(160 100% 55%)" stopOpacity="0" />
              </linearGradient>
              <filter id="pathGlow" x="-20%" y="-50%" width="140%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <motion.path
              d="M 200 60 Q 400 10, 600 60 T 1000 60"
              stroke="url(#pathGradient)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              filter="url(#pathGlow)"
              style={{ pathLength }}
            />
          </svg>

          {/* Luminous path — mobile vertical */}
          <svg
            className="lg:hidden absolute top-0 left-1/2 -translate-x-1/2 h-full w-32 pointer-events-none"
            viewBox="0 0 120 1000"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="pathGradientV" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(280 100% 65%)" stopOpacity="0" />
                <stop offset="15%" stopColor="hsl(280 100% 65%)" stopOpacity="1" />
                <stop offset="50%" stopColor="hsl(200 100% 65%)" stopOpacity="1" />
                <stop offset="85%" stopColor="hsl(160 100% 55%)" stopOpacity="1" />
                <stop offset="100%" stopColor="hsl(160 100% 55%)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d="M 60 50 Q 20 300, 60 500 T 60 950"
              stroke="url(#pathGradientV)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              style={{ pathLength }}
            />
          </svg>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-24 lg:gap-x-12 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center text-center px-4"
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{
                  type: 'spring',
                  stiffness: 90,
                  damping: 18,
                  delay: index * 0.15,
                }}
              >
                <div
                  className={`clay-icon w-28 h-28 mb-8 bg-gradient-to-br ${step.claySrc} ${step.shadow}`}
                >
                  <img src={step.imgSrc} alt={step.alt} className="w-16 h-16 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
                </div>

                <h3 className="font-title text-2xl md:text-3xl font-black mb-4 text-white tracking-tight">
                  {step.title}
                </h3>

                <p className="font-body text-base md:text-lg text-white/55 leading-relaxed font-medium max-w-xs">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          className="mt-24 md:mt-32 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        >
          <p className="font-body text-lg md:text-xl text-white/45 font-medium tracking-wide">
            <span className="gradient-text font-bold">{t('valueProp.trust1')}</span>
            <span className="mx-4 text-white/20">·</span>
            <span className="gradient-text font-bold">{t('valueProp.trust2')}</span>
            <span className="mx-4 text-white/20">·</span>
            <span className="gradient-text font-bold">{t('valueProp.trust3')}</span>
          </p>
        </motion.div>

      </div>
    </section>
  );
};

export default ValueProposition;

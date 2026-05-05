import { lazy, Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useHoverInteractions } from '@/hooks/useAnimeHooks';

const GlobeViz = lazy(() => import('@/components/GlobeViz'));

const infraLogos = [
  { src: '/images/polygon.webp', alt: 'Polygon', label: 'Polygon', bg: 'from-black-500 to-white-700' },
  { src: '/images/pinata.webp', alt: 'Pinata Cloud', label: 'Pinata Cloud', bg: 'from-emerald-400 to-teal-600' },
  { src: '/images/opensea.webp', alt: 'OpenSea', label: 'OpenSea', bg: 'from-blue-400 to-blue-600' },
  { src: '/images/walletConnect.webp', alt: 'WalletConnect', label: 'WalletConnect', bg: 'from-cyan-400 to-sky-600' },
];

const HeroSection = () => {
  const { t } = useTranslation();
  const { handleIconHover, handleIconLeave } = useHoverInteractions();
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <section
      id="home"
      className="min-h-[90vh] flex items-center relative overflow-x-hidden pt-28 sm:pt-32 mt-4 sm:mt-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8 xl:gap-16">

          {/* Left — title + subtitles + logos */}
          <motion.div
            className="flex-1 flex flex-col items-center text-center lg:items-start lg:text-left"
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.1 }}
          >
            <h1 className="font-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.02] tracking-tight">
              {t('hero.title1')}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 drop-shadow-[0_0_28px_rgba(168,85,247,0.55)]">
                {t('hero.title2')}
              </span>
            </h1>

            <p className="font-body text-lg sm:text-xl text-white/60 mb-3 max-w-xl leading-relaxed font-medium">
              {t('hero.subTitle1')}
            </p>
            <p className="font-body text-lg sm:text-xl text-white/60 mb-10 max-w-xl leading-relaxed font-medium">
              {t('hero.subTitle2')}
            </p>

            {/* Infrastructure logos — moved here, below the subtitle text */}
            <div className="flex flex-col items-center lg:items-start mt-2">
              <p className="font-title text-xs uppercase tracking-[0.22em] text-white/35 text-center lg:text-left mb-6 font-bold">
                {t('hero.infrastructure')}
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-8 sm:gap-10">
                {infraLogos.map((item) => (
                  <div
                    key={item.label}
                    onMouseEnter={(e) => handleIconHover(e as unknown as React.MouseEvent<HTMLDivElement>)}
                    onMouseLeave={(e) => handleIconLeave(e as unknown as React.MouseEvent<HTMLDivElement>)}
                    className="flex flex-col items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center rounded-2xl md:rounded-[1.75rem] bg-gradient-to-br ${item.bg} opacity-95 group-hover:opacity-100 transition-all duration-300 shadow-[inset_0_-6px_12px_rgba(0,0,0,0.3),_inset_0_4px_10px_rgba(255,255,255,0.4),_0_10px_20px_rgba(0,0,0,0.4)] group-hover:-translate-y-2 group-hover:scale-105 border border-white/20`}
                    >
                      <img
                        src={item.src}
                        alt={item.alt}
                        loading="lazy"
                        className="h-7 sm:h-8 md:h-10 object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)]"
                      />
                    </div>
                    <span className="font-body text-xs text-white/50 group-hover:text-white/90 transition-colors duration-300 font-medium">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right — globe with reflection */}
          <motion.div
            className="flex-1 flex flex-col items-center justify-center w-full lg:-mt-52"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.25 }}
          >
            <Suspense
              fallback={
                <div className="w-[340px] h-[340px] lg:w-[480px] lg:h-[480px] flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
                </div>
              }
            >
              <GlobeViz mobile={!isDesktop} />
            </Suspense>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;

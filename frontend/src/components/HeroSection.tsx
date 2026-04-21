import { useTranslation } from 'react-i18next';
import { useHoverInteractions } from '@/hooks/useAnimeHooks';
import { AnimeParticles } from '@/components/animations/AnimeComponents';

const HeroSection = () => {
  const { t } = useTranslation();
  const { handleIconHover, handleIconLeave } = useHoverInteractions();

  return (
    <section
      id="home"
      className="min-h-[90vh] flex items-center justify-center relative overflow-hidden pt-16 sm:pt-20 mt-6 sm:mt-10 reveal-group"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div
          className="glass rounded-3xl p-6 sm:p-10 md:p-14 relative overflow-hidden reveal-item opacity-0 border border-white/5"
        >
          <AnimeParticles />

          <div className="relative z-10">

            {/* Main Headline */}
            <h1
              className="font-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tighter drop-shadow-md reveal-item opacity-0"
            >
              {t('hero.title1')}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                {t('hero.title2')}
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="font-body text-base sm:text-xl text-muted-foreground mb-0 max-w-4xl mx-auto leading-relaxed reveal-item opacity-0"
            >
              {t('hero.subTitle1')}
            </p>
            <p
              className="font-body text-base sm:text-xl text-muted-foreground mb-10 md:mb-24 max-w-4xl mx-auto leading-relaxed reveal-item opacity-0"
            >
              {t('hero.subTitle2')}
            </p>

            {/* Infrastructure Section */}
            <div
              className="reveal-item opacity-0"
            >
              <p className="font-title text-xl sm:text-3xl font-bold mb-6 sm:mb-8 leading-tight">
                {t('hero.infrastructure')}
              </p>

              <div className="flex flex-wrap justify-center items-start gap-8 sm:gap-12 lg:gap-20">
                {[
                  { src: '/images/polygon.png', alt: 'Polygon', label: 'Polygon' },
                  { src: '/images/pinata.png', alt: 'Pinata Cloud', label: 'Pinata Cloud' },
                  { src: '/images/opensea.png', alt: 'OpenSea', label: 'OpenSea' },
                  { src: '/images/walletConnect.png', alt: 'WalletConnect', label: 'WalletConnect' },
                ].map((item) => (
                  <div
                    key={item.label}
                    onMouseEnter={(e) => handleIconHover(e as unknown as React.MouseEvent<HTMLDivElement>)}
                    onMouseLeave={(e) => handleIconLeave(e as unknown as React.MouseEvent<HTMLDivElement>)}
                    className="flex flex-col items-center gap-3 cursor-pointer"
                  >
                    <img
                      src={item.src}
                      alt={item.alt}
                      className="h-14 sm:h-20 md:h-28 transition-transform duration-300 hover:scale-105"
                    />
                    <span className="font-body text-xs sm:text-sm text-white/80">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

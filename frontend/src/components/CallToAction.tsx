import { useTranslation } from 'react-i18next';
import { AnimeParticles } from '@/components/animations/AnimeComponents';

const CallToAction = () => {
  const { t } = useTranslation();

  return (
    <section id="dao" className="pb-20 relative reveal-group">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          className="glass rounded-3xl p-6 sm:p-10 md:p-20 text-center relative overflow-hidden reveal-item opacity-0 border border-white/5"
        >
          <AnimeParticles />
          <div className="max-w-4xl mx-auto relative z-10">

            {/* Headline */}
            <h2 
              className="font-title text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight reveal-item opacity-0"
            >
              {t('cta.title1')}
              <span className="gradient-text">{t('cta.title2')}</span>
              {t('cta.title3')}
            </h2>

            {/* Description */}
            <p 
              className="font-body text-lg sm:text-xl md:text-2xl text-muted-foreground mb-12 sm:mb-16 leading-relaxed reveal-item opacity-0"
            >
              {t('cta.description')}
            </p>

            {/* Trust Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="glass rounded-xl p-6 reveal-item opacity-0 border border-white/10 hover:border-white/30 transition-colors duration-300">
                <div className="font-title text-2xl font-bold gradient-text">{t('cta.stats.free.title')}</div>
                <div className="font-body text-muted-foreground">{t('cta.stats.free.subtitle')}</div>
              </div>

              <div className="glass rounded-xl p-6 reveal-item opacity-0 border border-white/10 hover:border-white/30 transition-colors duration-300">
                <div className="font-title text-2xl font-bold gradient-text">{t('cta.stats.247.title')}</div>
                <div className="font-body text-muted-foreground">{t('cta.stats.247.subtitle')}</div>
              </div>

              <div className="glass rounded-xl p-6 reveal-item opacity-0 border border-white/10 hover:border-white/30 transition-colors duration-300">
                <div className="font-title text-2xl font-bold gradient-text">{t('cta.stats.instant.title')}</div>
                <div className="font-body text-muted-foreground">{t('cta.stats.instant.subtitle')}</div>
              </div>

              <div className="glass rounded-xl p-6 reveal-item opacity-0 border border-white/10 hover:border-white/30 transition-colors duration-300">
                <div className="font-title text-2xl font-bold gradient-text">{t('cta.stats.global.title')}</div>
                <div className="font-body text-muted-foreground">{t('cta.stats.global.subtitle')}</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;

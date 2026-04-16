import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ROLE_ICONS } from '@/config/roles';
import { useHoverInteractions } from '@/hooks/useAnimeHooks';
import { AnimeParticles } from '@/components/animations/AnimeComponents';

const ValueProposition = () => {
  const { t } = useTranslation();
  const { handleIconHover, handleIconLeave } = useHoverInteractions();

  return (
    <section id="community" className="pb-20 relative reveal-group">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-16 reveal-item opacity-0">
          <h2 className="font-title text-4xl md:text-5xl font-bold mb-4">
            {t('valueProp.title1')}<span className="gradient-text">{t('valueProp.title2')}</span>
          </h2>

          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('valueProp.subTitle')}
          </p>
        </div>

        {/* Flow Container */}
        <div className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden reveal-item opacity-0 border border-white/5">
          <AnimeParticles />
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-8 relative z-10">

            {/* Step 1 */}
            <div className="flex-1 text-center group reveal-item opacity-0">
              <div 
                className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer breathing-icon"
                onMouseEnter={handleIconHover}
                onMouseLeave={handleIconLeave}
              >
                <ROLE_ICONS.talent className="w-12 h-12 text-white" />
              </div>

              <h3 className="font-title text-2xl font-bold mb-4 gradient-text">
                {t('valueProp.step1Title')}
              </h3>

              <p className="font-body text-muted-foreground">
                {t('valueProp.step1Desc')}
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden lg:block reveal-item opacity-0">
              <ArrowRight className="w-8 h-8 text-primary opacity-60" />
            </div>

            {/* Step 2 */}
            <div className="flex-1 text-center group reveal-item opacity-0">
              <div 
                className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center cursor-pointer breathing-icon"
                onMouseEnter={handleIconHover}
                onMouseLeave={handleIconLeave}
              >
                <ROLE_ICONS.educator className="w-12 h-12 text-white" />
              </div>

              <h3 className="font-title text-2xl font-bold mb-4 gradient-text">
                {t('valueProp.step2Title')}
              </h3>

              <p className="font-body text-muted-foreground">
                {t('valueProp.step2Desc')}
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden lg:block reveal-item opacity-0">
              <ArrowRight className="w-8 h-8 text-primary opacity-60" />
            </div>

            {/* Step 3 */}
            <div className="flex-1 text-center group reveal-item opacity-0">
              <div 
                className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center cursor-pointer breathing-icon"
                onMouseEnter={handleIconHover}
                onMouseLeave={handleIconLeave}
              >
                <ROLE_ICONS.recruiter className="w-12 h-12 text-white" />
              </div>

              <h3 className="font-title text-2xl font-bold mb-4 gradient-text">
                {t('valueProp.step3Title')}
              </h3>

              <p className="font-body text-muted-foreground">
                {t('valueProp.step3Desc')}
              </p>
            </div>
          </div>

          {/* Trust Line */}
          <div className="mt-12 text-center reveal-item opacity-0">
            <div className="glass rounded-xl p-6 inline-block border border-white/10 relative z-10">
              <p className="font-body text-lg text-muted-foreground">
                <span className="gradient-text font-semibold">{t('valueProp.trust1')}</span> •
                <span className="gradient-text font-semibold"> {t('valueProp.trust2')}</span> •
                <span className="gradient-text font-semibold"> {t('valueProp.trust3')}</span>
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ValueProposition;

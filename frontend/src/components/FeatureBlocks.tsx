import { Vote, Shield, Zap, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ROLE_ICONS } from '@/config/roles';
import { useHoverInteractions } from '@/hooks/useAnimeHooks';

const FeatureBlocks = () => {
  const { t } = useTranslation();
  const { handleIconHover, handleIconLeave } = useHoverInteractions();

  const features = [
    {
      Icon: ROLE_ICONS.educator, // Emitir certificados
      title: t('features.items.nft.title'),
      description: t('features.items.nft.description'),
      color: 'from-purple-500 to-pink-500',
    },
    {
      Icon: ROLE_ICONS.recruiter, // Reclutador
      title: t('features.items.recruiter.title'),
      description: t('features.items.recruiter.description'),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      Icon: Vote, // DAO
      title: t('features.items.dao.title'),
      description: t('features.items.dao.description'),
      color: 'from-green-500 to-emerald-500',
    },
    {
      Icon: Shield, // Security
      title: t('features.items.security.title'),
      description: t('features.items.security.description'),
      color: 'from-orange-500 to-red-500',
    },
    {
      Icon: Zap, // Rapidez
      title: t('features.items.instant.title'),
      description: t('features.items.instant.description'),
      color: 'from-yellow-500 to-orange-500',
    },
    {
      Icon: Globe, // Global
      title: t('features.items.global.title'),
      description: t('features.items.global.description'),
      color: 'from-indigo-500 to-purple-500',
    },
  ];

  return (
    <section id="certificates" className="pt-4 sm:pt-8 pb-20 relative reveal-group">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-16 reveal-item opacity-0">
          <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {t('features.title1')}<span className="gradient-text">{t('features.title2')}</span>
          </h2>

          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('features.subTitle')}
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass rounded-2xl p-5 sm:p-8 border border-white/10 hover:border-white/30 transition-colors duration-500 group reveal-item opacity-0"
            >
              <div
                className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 cursor-pointer breathing-icon`}
                onMouseEnter={handleIconHover}
                onMouseLeave={handleIconLeave}
              >
                <feature.Icon className="w-8 h-8 text-white transition-colors duration-300" />
              </div>

              <h3 className="font-title text-2xl font-bold mb-4 gradient-text">
                {feature.title}
              </h3>

              <p className="font-body text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeatureBlocks;
